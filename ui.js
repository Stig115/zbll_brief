    var Ui = (function () {
        var timer;
        function checkProgress() {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(function () { if (lastStatus == "progress") setStatus("incorrect"); }, 3000);
        }

        var lastStatus = "init";
        var waiting = false;
        var partial = null;

        var incorrect = new Audio("incorrect.wav");
        incorrect.load();
        var correct = new Audio("correct.wav");
        correct.load();

        function setStatus(status) {
            lastStatus = status;
            switch (status) {
                case "correct":
                    correct.play();
                    document.getElementById("diagram").style.backgroundColor = "green";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    window.setTimeout(function () { if (lastStatus == "correct") waiting = true; }, 500);
                    partial = null;
                    break;
                case "partial":
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "goldenrod";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    break;
                case "incorrect":
                    incorrect.play();
                    document.getElementById("diagram").style.backgroundColor = "darkred";
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    window.setTimeout(function () { if (lastStatus == "incorrect") waiting = true; }, 500);
                    partial = null;
                    break;
                case "progress":
                    document.getElementById("diagram").style.backgroundColor = (partial ? "goldenrod" : "#444");
                    document.getElementById("retry").disabled = false;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    checkProgress();
                    break;
                case "init":
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "transparent";
                    document.getElementById("retry").disabled = true;
                    document.getElementById("next").disabled = false;
                    waiting = false;
                    partial = null;
                    break;
                case "error":
                    document.getElementById("status").innerHTML = "&nbsp;";
                    document.getElementById("diagram").style.backgroundColor = "transparent";
                    document.getElementById("retry").disabled = true;
                    document.getElementById("next").disabled = true;
                    waiting = false;
                    break;
            }
        }

        function verify(result) {
            function matchWithAdjustments(pat) {
                if (Cube.matchPattern(pat, result)) return true;
                if (Cube.matchPattern(pat, Cube.alg("U", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U'", result))) return true;
                if (Cube.matchPattern(pat, Cube.alg("U2", result))) return true;
                if (scramble == "roux") {
                    // try flipping M-slice too because some algs (with wide moves) flip this
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L2 R2 U2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L' R U2", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U'", result))) return true;
                    if (Cube.matchPattern(pat, Cube.alg("L R' U2", result))) return true;
                }
            }
            var pat;
            switch (scramble) {
                case "roux":
                    pat = "U.U...U.UL.LLLLLLLF.FF.FF.FR.RRRRRRRD.DD.DD.DB.BB.BB.B"; // M-slice free
                    break;
                case "cfop":
                    pat = "U.U...U.UL.LLLLLLLF.FFFFFFFR.RRRRRRRDDDDDDDDDBBBBBBB.B"; // whole first two layers
                    break;
                default: throw "Unknown scramble type: " + scramble;
            }
            if (matchWithAdjustments(pat)) {
                setStatus("correct");
                return true;
            }
            // check partial match (corners oriented, but not permuted)
            switch (scramble) {
                case "roux":
                    pat = "U.U...U.U...LLLLLL...F.FF.F...RRRRRRD.DD.DD.DB.BB.B..."; // M-slice free
                    break;
                case "cfop":
                    pat = "U.U...U.U...LLLLLL...FFFFFF...RRRRRRDDDDDDDDDBBBBBB..."; // whole first two layers
                    break;
                default: throw "Unknown scramble type: " + scramble;
            }
            if (Cube.matchPattern(pat, result)) {
                if (!partial) {
                    partial = instance; // record for retry
                    instance = result;
                    update(instance);
                    alg = "";
                    setStatus("partial");
                }
            }
            return false;
        }

        function twist(t) {
            if (waiting) {
                // retry/next with X/X'
                if (t.endsWith("'")) retry(); else next();
                return;
            }
            function check() {
                var rotations = ["", "x", "x y", "x y'", "x y2", "x z", "x z'", "x z2", "x'", "x' y", "x' y'", "x' z", "x' z'", "x2", "x2 y", "x2 y'", "x2 z", "x2 z'", "y", "y'", "y2", "z", "z'", "z2"];
                for (var i = 0; i < rotations.length; i++) {
                    var rot = rotations[i];
                    // apply rotation, alg, inverse rotation
                    var result = Cube.alg(rot, Cube.alg(alg, Cube.alg(rot, instance)), true);
                    if (verify(result)) return true;
                }
            }
            if (t == "") return;
            alg += t + ' ';
            var len = alg.split(' ').length;
            var progress = "";
            for (var i = 1; i < len; i++) {
                progress += "&bull; ";
            }
            document.getElementById("status").innerHTML = progress;
            setStatus("progress");
            check();
        }

        function showConnectButton() {
            var btn = document.getElementById("giikerConnect");
            btn.disabled = false;
            btn.innerText = "Connect Giiker Supercube";
            document.getElementById("cube").style.marginTop = "-80px";
            document.getElementById("giiker").style.display = "";
            document.getElementById("giikerDisconnectSection").style.display = "none";
        }

        function hideConnectButton() {
            document.getElementById("giiker").style.display = "none";
            document.getElementById("giikerDisconnectSection").style.display = "";
            document.getElementById("cube").style.marginTop = "0";
        }

        function connected() {
            hideConnectButton();
        }

        function error(ex) {
            showConnectButton();
            alert("Error: " + ex.message);
        }

        function giikerConnect() {
            var btn = document.getElementById("giikerConnect");
            btn.disabled = true;
            btn.innerText = "Connecting...";
            Giiker.connect(connected, twist, error);
        }

        function giikerDisconnect() {
            showConnectButton();
            Giiker.disconnect();
        }

        var instance = Cube.solved;
        var alg = "";
        var solution = "";
        var scramble = "";

        function update(cube) {
            var upcols = Settings.values.upColors;
            var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
            var edges = !Settings.values.simpleDiagram;
            var center = numColors > 1;
            Display.displayLL(Cube.faces(cube), center, edges, true, "cube");
        }

        function next() {
            function randomElement(arr) {
                return arr[Math.floor(Math.random() * arr.length)];
            }
            function lookupAlg(name) {
                for (var s in Algs.sets) {
                    var set = Algs.sets[s];
                    for (var a in set.algs) {
                        var alg = set.algs[a];
                        if (name == (s + '_' + alg.id)) return set.algs[a]
                    }
                }
                return { id: "unknown", name: "Unknown", alg: "", scramble: "cfop" }; // prevents errors if algs are removed but remain in settings (repaired by showing options pane)
            }
            function challenge(cas) {
                scramble = cas.scramble;
                var auf = Settings.values.randomAuf ? randomElement(["", "U ", "U' ", "U2 "]) : "";
                solution = auf + cas.alg;
                instance = Cube.solved;
                // up color
                var rot = [];
                var upcols = Settings.values.upColors;
                if (upcols.yellow) rot.push("");
                if (upcols.white) rot.push("x2");
                if (upcols.red) rot.push("x");
                if (upcols.orange) rot.push("x'");
                if (upcols.green) rot.push("z'");
                if (upcols.blue) rot.push("z");
                instance = Cube.random(rot, 1, instance);
                instance = Cube.random(["", "y", "y'", "y2"], 1, instance); // random orientation around y-axis
                var upColor = Cube.faceColor("U", Cube.faces(instance));
                if (cas.scramble == "roux") {
                    // scramble M-slice with U-layer
                    instance = Cube.random(["U", "U'", "U2", "M", "M'", "M2"], 100, instance);
                }
                // apply solution
                instance = Cube.alg(solution, instance, true);
                if (cas.scramble == "roux") {
                    var numColors = (upcols.yellow ? 1 : 0) + (upcols.white ? 1 : 0) + (upcols.red ? 1 : 0) + (upcols.orange ? 1 : 0) + (upcols.green ? 1 : 0) + (upcols.blue ? 1 : 0);
                    if (numColors > 1) {
                        // adjust M-slice so center top indicates color (too confusing otherwise!)
                        while (Cube.faceColor("U", Cube.faces(instance)) != upColor) {
                            instance = Cube.alg("M", instance);
                        }
                    }
                }
            }
            alg = "";
            if (Settings.values.algs.length > 0) {
                challenge(lookupAlg(randomElement(Settings.values.algs)));
                setStatus("init");
            } else {
                challenge(lookupAlg(""));
                setStatus("error");
            }
            update(instance);
        }

        function retry() {
            if (partial) instance = partial;
            alg = "";
            update(instance);
            setStatus("init");
        }

        return {
            twist: twist,
            giikerConnect: giikerConnect,
            giikerDisconnect: giikerDisconnect,
            next: next,
            retry: retry,
            showConnectButton: showConnectButton
        };
    }());