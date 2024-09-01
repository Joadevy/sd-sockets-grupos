import net from "net"
import { isValidJson, groupAmount } from "./auxiliares.js";

const messageToGroup = (groupNumber) => `SENDHola grupo ${groupNumber}!`
// Se conectara a un grupo random del 1 al groupAmount
const groupToConnect = Math.floor(Math.random() * groupAmount) + 1;

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
    console.log(`Conectado al coordinador del grupo ${groupToConnect} en ${address}:${port}`)
    coordinator.write(messageToGroup(groupToConnect))
  })

  // Manejar datos del coordinador de grupos
  coordinator.on("data", (data) => {
    console.log('Mensaje recibido del coordinador:', data.toString());
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
