from pathlib import Path

path = Path('src/oneblock_backend/main.mo')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)

replace_once(
'''    var stableConnections : [(Text, IntegrationConnection)] = [];
    var stableActivityRecords : [(Text, ActivityRecord)] = [];
    var stableIdempotencyKeys : [(Text, Text)] = []; // idempotency_key -> record_id
''',
'''    var stableConnections : [(Text, IntegrationConnection)] = [];
    var stableActivityRecords : [(Text, ActivityRecord)] = [];
    var stableActivityConnectionEpochs : [(Text, Int)] = []; // recordId -> connection.created_at
    var stableIdempotencyKeys : [(Text, Text)] = []; // idempotency_key -> record_id
''',
'stable activity provenance',
)

replace_once(
'''    var stablePublicDerivedSummaries : [(Text, DerivedSummary)] = [];
    var summaryCachesMigratedV1 : Bool = false;
''',
'''    var stablePublicDerivedSummaries : [(Text, DerivedSummary)] = [];
    var integrationCompositeKeysMigratedV1 : Bool = false;
    var summaryCachesMigratedV1 : Bool = false;
''',
'composite migration flag',
)

replace_once(
'''    transient var activityRecordsMap = TrieMap.TrieMap<Text, ActivityRecord>(Text.equal, Text.hash);
    activityRecordsMap := TrieMap.fromEntries<Text, ActivityRecord>(Iter.fromArray(stableActivityRecords), Text.equal, Text.hash);

    transient var idempotencyKeys = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
''',
'''    transient var activityRecordsMap = TrieMap.TrieMap<Text, ActivityRecord>(Text.equal, Text.hash);
    activityRecordsMap := TrieMap.fromEntries<Text, ActivityRecord>(Iter.fromArray(stableActivityRecords), Text.equal, Text.hash);

    transient var activityConnectionEpochs = TrieMap.TrieMap<Text, Int>(Text.equal, Text.hash);
    activityConnectionEpochs := TrieMap.fromEntries<Text, Int>(Iter.fromArray(stableActivityConnectionEpochs), Text.equal, Text.hash);

    transient var idempotencyKeys = TrieMap.TrieMap<Text, Text>(Text.equal, Text.hash);
''',
'activity provenance map',
)

replace_once(
'''        stableConnections := Iter.toArray(connections.entries());
        stableActivityRecords := Iter.toArray(activityRecordsMap.entries());
        stableIdempotencyKeys := Iter.toArray(idempotencyKeys.entries());
''',
'''        stableConnections := Iter.toArray(connections.entries());
        stableActivityRecords := Iter.toArray(activityRecordsMap.entries());
        stableActivityConnectionEpochs := Iter.toArray(activityConnectionEpochs.entries());
        stableIdempotencyKeys := Iter.toArray(idempotencyKeys.entries());
''',
'preupgrade provenance',
)

replace_once(
'''        stableConnections := [];
        stableActivityRecords := [];
        stableIdempotencyKeys := [];
        stableProfileActivityIndex := [];
        stableDerivedSummaries := [];

        // One-time compatibility migration for deployments created before the
''',
'''        stableConnections := [];
        stableActivityRecords := [];
        stableActivityConnectionEpochs := [];
        stableIdempotencyKeys := [];
        stableProfileActivityIndex := [];
        stableDerivedSummaries := [];

        // Migrate delimiter-based integration keys to collision-free length-prefixed
        // keys. Re-key from stored identities rather than trusting the old key text.
        if (not integrationCompositeKeysMigratedV1) {
            let connectionValues = Iter.toArray(connections.vals());
            connections := TrieMap.TrieMap<Text, IntegrationConnection>(Text.equal, Text.hash);
            for (connection in connectionValues.vals()) {
                connections.put(connectionKey(connection.profile_id, connection.app_id), connection)
            };

            let activityTypeValues = Iter.toArray(activityTypesMap.vals());
            activityTypesMap := TrieMap.TrieMap<Text, ActivityType>(Text.equal, Text.hash);
            for (activityType in activityTypeValues.vals()) {
                activityTypesMap.put(activityTypeKey(activityType.app_id, activityType.type_key), activityType)
            };

            // Summary keys used the same ambiguous delimiter scheme. Force the
            // record-by-record rebuild below so mixed/collided legacy aggregates
            // are never carried forward under the new key format.
            summaryCachesMigratedV1 := false;
            integrationCompositeKeysMigratedV1 := true
        };

        // One-time compatibility migration for deployments created before the
''',
'postupgrade composite migration',
)

replace_once(
'''                                    // Fail closed across reusable profile IDs: only evidence
                                    // created during the current profile incarnation is retained.
                                    if (record.ingest_timestamp >= profile.createtime) {
                                        let key = profileId # ":" # record.app_id # ":" # record.activity_type;
''',
'''                                    // Fail closed across reusable profile IDs and legacy
                                    // connections. A record must be attributable to a connection
                                    // epoch belonging to the current profile incarnation.
                                    if (recordBelongsToProfileIncarnation(profileId, profile, record)) {
                                        let key = summaryKey(profileId, record.app_id, record.activity_type);
''',
'migration provenance boundary',
)

replace_once(
'''    // Composite keys used in TrieMaps
    private func connectionKey(profileId : Text, appId : Text) : Text {
        profileId # ":" # appId
    };

    private func activityTypeKey(appId : Text, typeKey : Text) : Text {
        appId # ":" # typeKey
    };

    private func summaryKey(profileId : Text, appId : Text, activityType : Text) : Text {
        profileId # ":" # appId # ":" # activityType
    };
''',
'''    // Collision-free composite keys. Length-prefixing keeps arbitrary Text IDs,
    // including values containing ':', unambiguous without changing public APIs.
    private func keyPart(value : Text) : Text {
        Nat.toText(Text.size(value)) # ":" # value
    };

    private func connectionKey(profileId : Text, appId : Text) : Text {
        "connection:" # keyPart(profileId) # keyPart(appId)
    };

    private func activityTypeKey(appId : Text, typeKey : Text) : Text {
        "activity-type:" # keyPart(appId) # keyPart(typeKey)
    };

    private func summaryKey(profileId : Text, appId : Text, activityType : Text) : Text {
        "summary:" # keyPart(profileId) # keyPart(appId) # keyPart(activityType)
    };

    private func getConnectionExact(profileId : ProfileId, appId : AppId) : ?IntegrationConnection {
        switch (connections.get(connectionKey(profileId, appId))) {
            case (?connection) {
                if (connection.profile_id == profileId and connection.app_id == appId) {
                    ?connection
                } else {
                    null
                }
            };
            case null { null };
        }
    };
''',
'collision-free composite keys',
)

replace_once(
'''                                // A public profile ID is reusable. Purge any destination-only
                                // integration state left behind by a legacy rename before moving
                                // the current profile into that ID, then migrate only source state.
                                ignore profileActivityIndex.remove(nid);
                                for (app in integrationApps.vals()) {
                                    ignore connections.remove(nid # ":" # app.id)
                                };
''',
'''                                // A public profile ID is reusable. Purge any destination-only
                                // integration state left behind by a legacy rename before moving
                                // the current profile into that ID, then migrate only source state.
                                ignore profileActivityIndex.remove(nid);
                                for ((connectionKeyToRemove, connection) in Iter.toArray(connections.entries()).vals()) {
                                    if (connection.profile_id == nid) {
                                        ignore connections.remove(connectionKeyToRemove)
                                    }
                                };
''',
'changeId destination connection purge',
)

replace_once(
'''                                for (app in integrationApps.vals()) {
                                    let oldConnectionKey = oid # ":" # app.id;
                                    switch (connections.get(oldConnectionKey)) {
                                        case (?connection) {
                                            let newConnectionKey = nid # ":" # app.id;
                                            connections.put(newConnectionKey, { connection with profile_id = nid });
                                            ignore connections.remove(oldConnectionKey);
                                        };
                                        case null {};
                                    }
                                };
''',
'''                                for ((oldConnectionKey, connection) in Iter.toArray(connections.entries()).vals()) {
                                    if (connection.profile_id == oid) {
                                        ignore connections.remove(oldConnectionKey);
                                        connections.put(
                                            connectionKey(nid, connection.app_id),
                                            { connection with profile_id = nid }
                                        )
                                    }
                                };
''',
'changeId exact source connection migration',
)

replace_once(
'''    public query func getConnection(profileId : ProfileId, appId : AppId) : async ?IntegrationConnection {
        connections.get(connectionKey(profileId, appId))
    };
''',
'''    public query func getConnection(profileId : ProfileId, appId : AppId) : async ?IntegrationConnection {
        getConnectionExact(profileId, appId)
    };
''',
'exact getConnection',
)

replace_once(
'''        // Check an active connection exists for this profile+app
        let connKey = connectionKey(newRecord.profile_id, newRecord.app_id);
        switch (connections.get(connKey)) {
            case null { return #err("no active connection for this profile and app") };
            case (?c) {
                if (c.status != #active) {
                    return #err("connection is not active")
                };
                if (c.created_at < profile.createtime) {
                    return #err("connection belongs to an earlier profile incarnation")
                }
            }
        };
''',
'''        // Check an exact active connection exists for this profile+app and bind
        // the record to that connection epoch for future ownership checks.
        let connection = switch (getConnectionExact(newRecord.profile_id, newRecord.app_id)) {
            case null { return #err("no active connection for this profile and app") };
            case (?connection) {
                if (connection.status != #active) {
                    return #err("connection is not active")
                };
                if (connection.created_at < profile.createtime) {
                    return #err("connection belongs to an earlier profile incarnation")
                };
                connection
            };
        };
''',
'submit exact connection',
)

replace_once(
'''        activityRecordsMap.put(recordId, record);
        idempotencyKeys.put(idemKey, recordId);
''',
'''        activityRecordsMap.put(recordId, record);
        activityConnectionEpochs.put(recordId, connection.created_at);
        idempotencyKeys.put(idemKey, recordId);
''',
'record provenance write',
)

replace_once(
'''    private func callerOwnsActivityRecord(caller : Principal, recordId : RecordId) : Bool {
''',
'''    private func recordBelongsToProfileIncarnation(
        profileId : ProfileId,
        profile : Profile,
        record : ActivityRecord
    ) : Bool {
        if (record.ingest_timestamp < profile.createtime) {
            return false
        };

        switch (activityConnectionEpochs.get(record.id)) {
            case (?connectionEpoch) {
                // New records carry the exact connection epoch used at submission.
                connectionEpoch >= profile.createtime and record.ingest_timestamp >= connectionEpoch
            };
            case null {
                // Legacy records have no provenance marker. Fail closed unless the
                // exact current connection itself belongs to this profile incarnation
                // and existed before the record was ingested.
                switch (getConnectionExact(profileId, record.app_id)) {
                    case (?connection) {
                        connection.created_at >= profile.createtime and
                        record.ingest_timestamp >= connection.created_at
                    };
                    case null { false };
                }
            };
        }
    };

    private func callerOwnsActivityRecord(caller : Principal, recordId : RecordId) : Bool {
''',
'provenance helper',
)

replace_once(
'''                            case (?record) {
                                activityIndexContains(profileId, recordId) and
                                record.ingest_timestamp >= profile.createtime
                            };
''',
'''                            case (?record) {
                                activityIndexContains(profileId, recordId) and
                                recordBelongsToProfileIncarnation(profileId, profile, record)
                            };
''',
'caller ownership provenance',
)

replace_once(
'''    private func canReadActivityRecord(caller : Principal, profile : Profile, record : ActivityRecord) : Bool {
        // A reused profile ID must never inherit evidence created before this
        // profile incarnation existed, even if a legacy index still uses that ID.
        if (record.ingest_timestamp < profile.createtime) {
            return false
        };
''',
'''    private func canReadActivityRecord(
        caller : Principal,
        profileId : ProfileId,
        profile : Profile,
        record : ActivityRecord
    ) : Bool {
        if (not recordBelongsToProfileIncarnation(profileId, profile, record)) {
            return false
        };
''',
'list read provenance',
)

replace_once(
'''                    if (appMatch and typeMatch and canReadActivityRecord(caller, profile, record)) {
''',
'''                    if (appMatch and typeMatch and canReadActivityRecord(caller, profileId, profile, record)) {
''',
'list call provenance',
)

path.write_text(text)
