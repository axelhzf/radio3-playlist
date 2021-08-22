import * as spotify from "./spotify"
// @ponicode
describe("auth", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", () => {
        let callFunction: any = () => {
            inst.auth("Australian Freshwater Crocodile", "from")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            inst.auth("Australian Freshwater Crocodile", "not in")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            inst.auth("Saltwater Crocodile", "call")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            inst.auth("Saltwater Crocodile", "test_token")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            inst.auth("Saltwater Crocodile", "not")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            inst.auth("", "")
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("getToken", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        await inst.getToken("function readToken_lt_gt(code) {\n\t      // '<>'\n\t      var next = this.input.charCodeAt(this.state.pos + 1);\n\t      var size = 1;\n\t\n\t      if (next === code) {\n\t        size = code === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2;\n\t        if (this.input.charCodeAt(this.state.pos + size) === 61) return this.finishOp(_types.types.assign, size + 1);\n\t        return this.finishOp(_types.types.bitShift, size);\n\t      }\n\t\n\t      if (next === 33 && code === 60 && this.input.charCodeAt(this.state.pos + 2) === 45 && this.input.charCodeAt(this.state.pos + 3) === 45) {\n\t        if (this.inModule) this.unexpected();\n\t        // `<!--`, an XML-style comment that should be interpreted as a line comment\n\t        this.skipLineComment(4);\n\t        this.skipSpace();\n\t        return this.nextToken();\n\t      }\n\t\n\t      if (next === 61) {\n\t        // <= | >=\n\t        size = 2;\n\t      }\n\t\n\t      return this.finishOp(_types.types.relational, size);\n\t    }")
    })

    test("1", async () => {
        await inst.getToken("function unescape(code) {\n        return code.replace(/\\\\('|\\\\)/g, \"$1\").replace(/[\\r\\t\\n]/g, \" \");\n    }")
    })

    test("2", async () => {
        await inst.getToken("function substr(start, length) {\n        return string_substr.call(\n            this,\n            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,\n            length\n        );\n    }")
    })

    test("3", async () => {
        await inst.getToken("function log(code) {\n        var args = [];\n        for (var _i = 1; _i < arguments.length; _i++) {\n            args[_i - 1] = arguments[_i];\n        }\n        console.log(utils.tr.apply(null, arguments));\n    }\n")
    })

    test("4", async () => {
        await inst.getToken("function(code) {\n\t\t\t\treturn I.mode === 'client' || !Basic.arrayDiff(code, [200, 404]);\n\t\t\t}")
    })

    test("5", async () => {
        await inst.getToken("")
    })
})

// @ponicode
describe("getUserPlaylists", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        await inst.getUserPlaylists()
    })
})

// @ponicode
describe("searchTrack", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        await inst.searchTrack({ artist: "US", title: "Direct Functionality Orchestrator" })
    })

    test("1", async () => {
        await inst.searchTrack({ artist: "US", title: "Dynamic Quality Specialist" })
    })

    test("2", async () => {
        await inst.searchTrack({ artist: "US", title: "Future Interactions Representative" })
    })

    test("3", async () => {
        await inst.searchTrack({ artist: "China", title: "Internal Interactions Strategist" })
    })

    test("4", async () => {
        await inst.searchTrack({ artist: "United States", title: "Direct Functionality Orchestrator" })
    })

    test("5", async () => {
        await inst.searchTrack({ artist: "", title: "" })
    })
})

// @ponicode
describe("searchTracks", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        let param1: any = [{ artist: "China", title: "Direct Functionality Orchestrator" }, { artist: "China", title: "Dynamic Quality Specialist" }, { artist: "France", title: "Dynamic Quality Specialist" }, { artist: "United States", title: "Internal Interactions Strategist" }]
        await inst.searchTracks(param1)
    })

    test("1", async () => {
        let param1: any = [{ artist: "France", title: "International Intranet Coordinator" }, { artist: "China", title: "Internal Interactions Strategist" }, { artist: "FR", title: "Internal Interactions Strategist" }, { artist: "US", title: "Internal Interactions Strategist" }, { artist: "China", title: "Future Interactions Representative" }]
        await inst.searchTracks(param1)
    })

    test("2", async () => {
        let param1: any = [{ artist: "FR", title: "Internal Interactions Strategist" }, { artist: "France", title: "Dynamic Quality Specialist" }, { artist: "France", title: "Internal Interactions Strategist" }, { artist: "US", title: "Internal Interactions Strategist" }]
        await inst.searchTracks(param1)
    })

    test("3", async () => {
        let param1: any = [{ artist: "China", title: "Dynamic Quality Specialist" }, { artist: "China", title: "Future Interactions Representative" }, { artist: "GB", title: "Internal Interactions Strategist" }, { artist: "US", title: "Dynamic Quality Specialist" }]
        await inst.searchTracks(param1)
    })

    test("4", async () => {
        let param1: any = [{ artist: "France", title: "Dynamic Quality Specialist" }, { artist: "United States", title: "Internal Interactions Strategist" }, { artist: "China", title: "Direct Functionality Orchestrator" }, { artist: "GB", title: "Future Interactions Representative" }]
        await inst.searchTracks(param1)
    })

    test("5", async () => {
        await inst.searchTracks([])
    })
})

// @ponicode
describe("addTracksToPlaylist", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        let param2: any = [{ artist: "FR", title: "Dynamic Quality Specialist" }, { artist: "France", title: "International Intranet Coordinator" }, { artist: "US", title: "Direct Functionality Orchestrator" }, { artist: "FR", title: "Internal Interactions Strategist" }, { artist: "US", title: "Future Interactions Representative" }]
        await inst.addTracksToPlaylist(123, param2)
    })

    test("1", async () => {
        let param2: any = [{ artist: "France", title: "Internal Interactions Strategist" }, { artist: "France", title: "Direct Functionality Orchestrator" }, { artist: "GB", title: "Internal Interactions Strategist" }]
        await inst.addTracksToPlaylist("username", param2)
    })

    test("2", async () => {
        let param2: any = [{ artist: "FR", title: "Direct Functionality Orchestrator" }, { artist: "FR", title: "Future Interactions Representative" }, { artist: "FR", title: "Future Interactions Representative" }, { artist: "France", title: "Direct Functionality Orchestrator" }, { artist: "China", title: "Dynamic Quality Specialist" }]
        await inst.addTracksToPlaylist("user123", param2)
    })

    test("3", async () => {
        let param2: any = [{ artist: "US", title: "International Intranet Coordinator" }]
        await inst.addTracksToPlaylist("user_name", param2)
    })

    test("4", async () => {
        let param2: any = [{ artist: "GB", title: "International Intranet Coordinator" }, { artist: "United States", title: "Direct Functionality Orchestrator" }, { artist: "United States", title: "Direct Functionality Orchestrator" }, { artist: "United States", title: "Dynamic Quality Specialist" }, { artist: "FR", title: "Internal Interactions Strategist" }]
        await inst.addTracksToPlaylist("user_name", param2)
    })

    test("5", async () => {
        await inst.addTracksToPlaylist("", [])
    })
})

// @ponicode
describe("getAllPlaylistTracks", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        await inst.getAllPlaylistTracks("7289708e-b17a-477c-8a77-9ab575c4b4d8")
    })

    test("1", async () => {
        await inst.getAllPlaylistTracks("03ea49f8-1d96-4cd0-b279-0684e3eec3a9")
    })

    test("2", async () => {
        await inst.getAllPlaylistTracks("a85a8e6b-348b-4011-a1ec-1e78e9620782")
    })

    test("3", async () => {
        await inst.getAllPlaylistTracks("")
    })
})

// @ponicode
describe("getMe", () => {
    let inst: any

    beforeEach(() => {
        inst = new spotify.Spotify()
    })

    test("0", async () => {
        await inst.getMe()
    })
})
