from pathlib import Path

path = Path('src/oneblock_backend/main.mo')
s = path.read_text()

old = '''        if (Iter.size(publicDerivedSummaries.entries()) == 0) {
            for (record in activityRecordsMap.vals()) {
                if (record.visibility == #global) {
                    let key = record.profile_id # ":" # record.app_id # ":" # record.activity_type;
                    let existing = publicDerivedSummaries.get(key);
                    let (prevCount, prevTotal, prevCurrency) = switch (existing) {
                        case null { (0, null, record.currency) };
                        case (?summary) { (summary.record_count, summary.total_amount, summary.currency) };
                    };
                    let nextTotal : ?Float = switch (record.amount) {
                        case null { prevTotal };
                        case (?amount) {
                            switch (prevTotal) {
                                case null { ?amount };
                                case (?total) { ?(total + amount) };
                            }
                        };
                    };
                    let lastUpdated = switch (existing) {
                        case null { record.ingest_timestamp };
                        case (?summary) {
                            if (record.ingest_timestamp > summary.last_updated) { record.ingest_timestamp } else { summary.last_updated }
                        };
                    };
                    publicDerivedSummaries.put(key, {
                        profile_id = record.profile_id;
                        app_id = record.app_id;
                        activity_type = record.activity_type;
                        record_count = prevCount + 1;
                        total_amount = nextTotal;
                        currency = prevCurrency;
                        last_updated = lastUpdated;
                    })
                }
            }
        };'''
new = '''        if (Iter.size(publicDerivedSummaries.entries()) == 0) {
            // TrieMap iteration order is not chronological. Sort legacy records so
            // currency retains the earliest visible record's value deterministically.
            let sortedActivityRecords = Array.sort<ActivityRecord>(
                Iter.toArray(activityRecordsMap.vals()),
                func(a : ActivityRecord, b : ActivityRecord) : Order.Order {
                    if (a.ingest_timestamp < b.ingest_timestamp) { #less }
                    else if (a.ingest_timestamp == b.ingest_timestamp) { #equal }
                    else { #greater }
                }
            );
            for (record in sortedActivityRecords.vals()) {
                // Only attach legacy evidence to the current incarnation of an ID.
                // Records that predate the current profile (or whose old ID is now
                // orphaned after a rename) fail closed instead of transferring to a
                // later claimant of the same reusable profile ID.
                switch (profiles.get(record.profile_id)) {
                    case (?profile) {
                        if (record.visibility == #global and record.ingest_timestamp >= profile.createtime) {
                            let key = record.profile_id # ":" # record.app_id # ":" # record.activity_type;
                            let existing = publicDerivedSummaries.get(key);
                            let (prevCount, prevTotal, prevCurrency) = switch (existing) {
                                case null { (0, null, record.currency) };
                                case (?summary) { (summary.record_count, summary.total_amount, summary.currency) };
                            };
                            let nextTotal : ?Float = switch (record.amount) {
                                case null { prevTotal };
                                case (?amount) {
                                    switch (prevTotal) {
                                        case null { ?amount };
                                        case (?total) { ?(total + amount) };
                                    }
                                };
                            };
                            publicDerivedSummaries.put(key, {
                                profile_id = record.profile_id;
                                app_id = record.app_id;
                                activity_type = record.activity_type;
                                record_count = prevCount + 1;
                                total_amount = nextTotal;
                                currency = prevCurrency;
                                last_updated = record.ingest_timestamp;
                            })
                        }
                    };
                    case null {};
                }
            }
        };'''
assert old in s, 'postupgrade block not found'
s = s.replace(old, new)

old = '''        // Verify caller is the registered app owner or an admin
        let appOpt = integrationApps.get(newRecord.app_id);'''
new = '''        // Resolve the current profile incarnation before trusting integration
        // indexes keyed by a reusable public profile id.
        let profile = switch (profiles.get(newRecord.profile_id)) {
            case null { return #err("profile not found") };
            case (?profile) { profile };
        };
        // Verify caller is the registered app owner or an admin
        let appOpt = integrationApps.get(newRecord.app_id);'''
assert old in s, 'submit profile insertion point not found'
s = s.replace(old, new)

old = '''            case (?c) {
                if (c.status != #active) {
                    return #err("connection is not active")
                }
            }'''
new = '''            case (?c) {
                if (c.status != #active) {
                    return #err("connection is not active")
                };
                if (c.created_at < profile.createtime) {
                    return #err("connection belongs to an earlier profile incarnation")
                }
            }'''
assert old in s, 'connection validation not found'
s = s.replace(old, new, 1)

old = '''        let existing = derivedSummaries.get(sKey);
        let (prevCount, prevTotal, prevCurrency) = switch (existing) {'''
new = '''        let existing = switch (derivedSummaries.get(sKey)) {
            case (?summary) {
                if (summary.last_updated >= profile.createtime) { ?summary } else { null }
            };
            case null { null };
        };
        let (prevCount, prevTotal, prevCurrency) = switch (existing) {'''
assert old in s, 'full summary existing not found'
s = s.replace(old, new, 1)

old = '''            let publicExisting = publicDerivedSummaries.get(sKey);
            let (publicPrevCount, publicPrevTotal, publicPrevCurrency) = switch (publicExisting) {'''
new = '''            let publicExisting = switch (publicDerivedSummaries.get(sKey)) {
                case (?summary) {
                    if (summary.last_updated >= profile.createtime) { ?summary } else { null }
                };
                case null { null };
            };
            let (publicPrevCount, publicPrevTotal, publicPrevCurrency) = switch (publicExisting) {'''
assert old in s, 'public summary existing not found'
s = s.replace(old, new, 1)

old = '''    private func callerOwnsActivityRecord(caller : Principal, recordId : RecordId) : Bool {
        switch (userprofiles.get(caller)) {
            case null { false };
            case (?profileId) { activityIndexContains(profileId, recordId) };
        }
    };

    private func canReadActivityRecord(caller : Principal, profile : Profile, record : ActivityRecord) : Bool {
        if (caller == profile.owner) {
            return true
        };'''
new = '''    private func callerOwnsActivityRecord(caller : Principal, recordId : RecordId) : Bool {
        switch (userprofiles.get(caller)) {
            case null { false };
            case (?profileId) {
                switch (profiles.get(profileId)) {
                    case null { false };
                    case (?profile) {
                        switch (activityRecordsMap.get(recordId)) {
                            case null { false };
                            case (?record) {
                                activityIndexContains(profileId, recordId) and
                                record.ingest_timestamp >= profile.createtime
                            };
                        }
                    };
                }
            };
        }
    };

    private func canReadActivityRecord(caller : Principal, profile : Profile, record : ActivityRecord) : Bool {
        // A reused profile ID must never inherit evidence created before this
        // profile incarnation existed, even if a legacy index still uses that ID.
        if (record.ingest_timestamp < profile.createtime) {
            return false
        };
        if (caller == profile.owner) {
            return true
        };'''
assert old in s, 'activity ownership helpers not found'
s = s.replace(old, new)

old = '''                if (caller == profile.owner) {
                    derivedSummaries.get(key)
                } else {
                    publicDerivedSummaries.get(key)
                }'''
new = '''                let summary = if (caller == profile.owner) {
                    derivedSummaries.get(key)
                } else {
                    publicDerivedSummaries.get(key)
                };
                switch (summary) {
                    case (?value) {
                        if (value.last_updated >= profile.createtime) { ?value } else { null }
                    };
                    case null { null };
                }'''
assert old in s, 'summary read block not found'
s = s.replace(old, new)

path.write_text(s)
