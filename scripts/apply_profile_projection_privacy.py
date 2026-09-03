from pathlib import Path

MAIN = Path("src/oneblock_backend/main.mo")
WORKFLOW = Path(".github/workflows/apply-profile-projection-privacy.yml")
SELF = Path(__file__)
text = MAIN.read_text()


def replace_once(label: str, old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)


old_profiles = '''    public query func getProfiles(pageSize : Nat, pageNumber : Nat) : async [Profile] {\n        let profileEntries = Iter.toArray(profiles.entries());\n        let totalProfiles = profileEntries.size();\n        let startIndex = pageNumber * pageSize;\n        let endIndex = startIndex + pageSize;\n\n        let slicedProfiles = Array.tabulate<Profile>(\n            Nat.min(endIndex - startIndex, totalProfiles - startIndex),\n            func(i) {\n                let (_, profile) = profileEntries[startIndex + i];\n                profile\n            },\n        );\n\n        slicedProfiles\n    };\n'''
new_profiles = '''    // Public profile reads expose only public evidence indexes. The owner keeps\n    // the full block/trait index through caller-aware reads and getMyProfile.\n    private func sanitizeProfileEvidence(caller : Principal, profile : Profile) : Profile {\n        if (caller == profile.owner) {\n            return profile\n        };\n\n        let publicBlocks = Buffer.Buffer<Text>(0);\n        for (blockId in profile.blocks.vals()) {\n            switch (blocks.get(blockId)) {\n                case (?block) {\n                    if (block.visibility == #global) {\n                        publicBlocks.add(blockId)\n                    }\n                };\n                case null {};\n            }\n        };\n\n        let publicTraits = Buffer.Buffer<Text>(0);\n        for (traitId in profile.traits.vals()) {\n            switch (traits.get(traitId)) {\n                case (?trait) {\n                    if (trait.visibility == #global) {\n                        publicTraits.add(traitId)\n                    }\n                };\n                case null {};\n            }\n        };\n\n        {\n            profile with\n            blocks = Buffer.toArray(publicBlocks);\n            traits = Buffer.toArray(publicTraits);\n        }\n    };\n\n    public query ({ caller }) func getProfiles(pageSize : Nat, pageNumber : Nat) : async [Profile] {\n        let profileEntries = Iter.toArray(profiles.entries());\n        let totalProfiles = profileEntries.size();\n        let startIndex = pageNumber * pageSize;\n        if (startIndex >= totalProfiles) {\n            return []\n        };\n        let resultSize = Nat.min(pageSize, totalProfiles - startIndex);\n\n        Array.tabulate<Profile>(\n            resultSize,\n            func(i) {\n                let (_, profile) = profileEntries[startIndex + i];\n                sanitizeProfileEvidence(caller, profile)\n            },\n        )\n    };\n'''
replace_once("profile list projection", old_profiles, new_profiles)

replace_once(
    "default profiles signature",
    "    public query func getDefaultProfiles(size : Nat) : async [Profile] {",
    "    public query ({ caller }) func getDefaultProfiles(size : Nat) : async [Profile] {",
)
replace_once(
    "default profile projection",
    "            func(i) { sortedProfiles[i] },",
    "            func(i) { sanitizeProfileEvidence(caller, sortedProfiles[i]) },",
)
replace_once(
    "search profiles signature",
    "    public query func searchProfilesByName(q : Text) : async [Profile] {",
    "    public query ({ caller }) func searchProfilesByName(q : Text) : async [Profile] {",
)
replace_once(
    "search profile projection",
    '''            func(i) {\n                let (profile) = sortedProfiles[i];\n                profile\n            },\n''',
    '''            func(i) {\n                let (profile) = sortedProfiles[i];\n                sanitizeProfileEvidence(caller, profile)\n            },\n''',
)
replace_once(
    "single profile projection",
    '''    public query func getProfile(id : Text) : async ?Profile {\n        profiles.get(id)\n    };\n''',
    '''    public query ({ caller }) func getProfile(id : Text) : async ?Profile {\n        switch (profiles.get(id)) {\n            case null { null };\n            case (?profile) { ?sanitizeProfileEvidence(caller, profile) };\n        }\n    };\n''',
)
replace_once(
    "principal profile projection",
    '''    public query func getProfileByPrincipal(principal : Text) : async ?Profile {\n        let pt = userprofiles.get(Principal.fromText(principal));\n        switch (pt) {\n            case (?pt) {\n                profiles.get(pt)\n            };\n            case (_) {\n                null\n            }\n        }\n    };\n''',
    '''    public query ({ caller }) func getProfileByPrincipal(principal : Text) : async ?Profile {\n        let pt = userprofiles.get(Principal.fromText(principal));\n        switch (pt) {\n            case (?pt) {\n                switch (profiles.get(pt)) {\n                    case null { null };\n                    case (?profile) { ?sanitizeProfileEvidence(caller, profile) };\n                }\n            };\n            case (_) {\n                null\n            }\n        }\n    };\n''',
)

MAIN.write_text(text)
if WORKFLOW.exists():
    WORKFLOW.unlink()
SELF.unlink()
