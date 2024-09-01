import net from "net"
import { isValidJson, groupAmount, isValidGroupNumber} from "./auxiliares.js";
import readline from "readline";

const messageToGroup = (groupNumber) => `SENDHola grupo ${groupNumber}!`

// Configuración para leer la entrada del usuario desde la consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Se conectara a un grupo del 1 al groupAmount
let groupToConnect;
rl.question("Ingrese el numero de grupo a conectarse: ", (userInput) => {
  groupToConnect = isValidGroupNumber(userInput) ? Number(userInput) : Math.floor(Math.random() * groupAmount) + 1;

  const client = new net.Socket()
  client.connect({ port: 8080, host: process.argv[2] ?? "localhost" }, () => {
    console.log("Conectado al servidor de grupos");

    // Se envia el numero de grupo al que se quiere conectar
    client.write(groupToConnect.toString());
  })

  client.on("data", (data) => {
    // Recibe el mensaje del servidor de grupos
    const msgFromServerGroup = data.toString();

    if (msgFromServerGroup.startsWith('Grupo no valido')) {
      console.error(msgFromServerGroup);
      client.end();
      return;
    } 

    if (!isValidJson(msgFromServerGroup)) {
      console.log('no es valido el JSON!');
      console.log(msgFromServerGroup);
      return;
    }

    const {address, port} = JSON.parse(msgFromServerGroup); // Porque viene en formato {"address":<address>,"port":<port>}
    console.log(`Direccion: ${address}, Puerto: ${port}`);
    // Ajustar la dirección si es "::" a "::1" para conexiones locales
    const ipAddress = address === '::' ? '::1' : address;

    // Conectarse al coordinador de grupos que devolvio el servidor de grupos
    const coordinator = new net.Socket()
    coordinator.connect({ port: Number(port), host: ipAddress }, () => {
      console.log(`Conectado al coordinador del grupo ${groupToConnect} en ${address}:${port}`);

      // Leer el mensaje del usuario desde la consola y enviarlo al grupo
      rl.question("Ingrese el mensaje para el grupo: ", (userInput) => {
        const messageToGroup = `SEND ${userInput}`;
        coordinator.write(messageToGroup);
      });
    })

    // Manejar datos del coordinador de grupos
    coordinator.on("data", (data) => {
      console.log('Mensaje recibido del coordinador:', data.toString());

      if (data.toString().startsWith('Desconectado')) {
        rl.close();
        console.log("\nCerrando cliente...");
        return;
      }

        // Leer el mensaje del usuario desde la consola y enviarlo al grupo
      rl.question("Ingrese el mensaje para el grupo (Envie CLOSE para cerrar): ", (userInput) => {
        if (userInput === 'CLOSE') {
          coordinator.write('CLOSE');
          return;
        }

        const messageToGroup = `SEND${userInput}`;
        coordinator.write(messageToGroup);
      });
    });

    // Manejar cierre de la conexión al coordinador de grupos
    coordinator.on("end", () => {
      console.log('Desconectado del coordinador');
    });

    // Manejar errores en la conexion con el coordinador de grupos
    coordinator.on("error", (err) => {
      console.error('Error en la conexión al coordinador:', err.message);
    });
  })

  client.on("error", (err) => {
    console.error('Error en la conexión al servidor de grupos:', err.message);
  });
});

