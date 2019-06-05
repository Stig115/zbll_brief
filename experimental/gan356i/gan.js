var cube = {};

function display()
{

}

async function connect()
{
    try
    {
        console.log("Attempting to pair.")
        const PRIMARY_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";

        var device = await window.navigator.bluetooth.requestDevice({ filters: [{ namePrefix: "GAN-" }], optionalServices: [PRIMARY_UUID] });
        console.log("Device: ", device);
        cube.name = device.name;
        cube.id = device.id;
        device.addEventListener("gattserverdisconnected", event =>
        {
            alert("Disconnected!");
            cube.connected = false;
            display();
        });

        var server = await device.gatt.connect();
        console.log("Server: ", server);
        cube.connected = server.connected;

        var service = await server.getPrimaryService(PRIMARY_UUID);
        console.log("Service: ", service);
        cube.service = service.uuid;

        var characteristics = await service.getCharacteristics();
        console.log(characteristics);

        for (var i in characteristics)
        {
            var c = characteristics[i];
            console.log("Characteristic: ", c);

            var descriptors = await c.getDescriptors();
            for (var j in descriptors)
            {
                var d = descriptors[j];
                console.log("  Descriptor: ", d);
            }

            if (c.properties.read || c.properties.notify)
            {
                var htm = document.createElement("div");
                htm.id = c.uuid;
                document.getElementById("raw").appendChild(htm);
                c.addEventListener('characteristicvaluechanged', event =>
                {
                    var value = event.target.value;
                    var len = value.byteLength;
                    var bytes = [];
                    for (var k = 0; k < len; k++)
                    {
                        var b = value.getUint8(k);
                        bytes.push(b);
                    }
                    console.log("Data: ", { i: i, data: bytes });
                    var htm = "<table width='100%'><tr><td colspan='" + len + "'>" + event.target.uuid + "</td></tr><tr>";
                    for (var k = 0; k < len; k++)
                    {
                        var b = value.getUint8(k);
                        htm += "<td width='" + Math.round(100 / len) + "%' align='center'>" + b + "</td>";
                    }
                    htm += "</tr></table>"
                    document.getElementById(event.target.uuid).innerHTML = htm;
                    event.target.readValue();
                });
                if (c.properties.read)
                {
                    c.readValue();
                }
                if (c.properties.notify)
                {
                    c.startNotifications();
                }
            }
        }

        // pose
        characteristics[4].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var x = value.getInt16(0, true);
            var y = value.getInt16(2, true);
            var z = value.getInt16(4, true);
            document.getElementById("pose").innerHTML = "x: " + x + "<br />y: " + y + "<br />z: " + z;
        });

        // encoders
        characteristics[6].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var sides = "URFDLB";
            var htm = "";
            for (var i = 0; i < 6; i++)
            {
                htm += sides[i] + ": " + value.getUint8(i) + "<br />";
            }
            document.getElementById("encoders").innerHTML = htm;
        });

        // twists (last 6 bytes of characteristic 3 seems like the same thing...)
        characteristics[2].addEventListener('characteristicvaluechanged', event =>
        {
            var value = event.target.value;
            var twists = ["U", "?", "U'", "R", "?", "R'", "F", "?", "F'", "D", "?", "D'", "L", "?", "L'", "B", "?", "B'"]
            var htm = "Count: " + value.getUint8(0) + "<br />";
            for (var i = 1; i < 19; i++)
            {
                htm += twists[value.getUint8(i)] + " ";
            }
            document.getElementById("twists").innerHTML = htm;
        });

       /*
        var lastCount = undefined;
        while (true)
        {
            var c = characteristics[4];
            var value = await c.readValue();
            var len = value.byteLength;
            var bytes = [];
            for (var k = 0; k < len; k++)
            {
                var b = value.getUint8(k);
                bytes.push(b);
                var count = value.getUint8(12);
                var diff = count - lastCount;
                if (diff < 0) diff += 255;
                // console.log("Count: ", diff);
                if (lastCount === undefined)
                {
                    lastCount = count;
                }
                if (count != lastCount)
                {
                    var twist = value.getUint8(18);
                    switch (twist) 
                    {
                        case 0:
                            console.log("Twist: U");
                            break;
                        case 2:
                            console.log("Twist: U'");
                            break;
                        case 3:
                            console.log("Twist: R");
                            break;
                        case 5:
                            console.log("Twist: R'");
                            break;
                        case 6:
                            console.log("Twist: F");
                            break;
                        case 8:
                            console.log("Twist: F'");
                            break;
                        case 9:
                            console.log("Twist: D");
                            break;
                        case 11:
                            console.log("Twist: D'");
                            break;
                        case 12:
                            console.log("Twist: L");
                            break;
                        case 14:
                            console.log("Twist: L'");
                            break;
                        case 15:
                            console.log("Twist: B");
                            break;
                        case 17:
                            console.log("Twist: B'");
                            break;
                        default:
                            console.log("Twist: ERROR!");
                            break;
                    }
                    lastCount = count;
                }
            }
        }
        */
    }
    catch (ex)
    {
        console.log("ERROR: ", ex);
    }
}