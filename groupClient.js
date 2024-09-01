import net from "net"
import { isValidJson } from "./auxiliares.js";

const asignationServer = new net.Socket()
asignationServer.connect({ port: 8888, host: process.argv[2] ?? "localhost" }, () => {
  console.log("Conectado al servidor de asignacion de grupos");
  // Al conectarse al servidor de asignacion, este le asignara un grupo automaticamente
})

  asignationServer.on("data", (data) => {
    // Recibe el mensaje del servidor de asignacion de grupos (contendra direccion y puerto del coordinador de grupo asignado)
    const msgFromAsignation = data.toString();

    console.log('Mensaje recibido del servidor de asignacion:', msgFromAsignation);

    if (!isValidJson(msgFromAsignation)) {
      console.log('no es valido el JSON!');
      console.log(msgFromAsignation);
      return;
    }

    const {address, port} = JSON.parse(msgFromAsignation); // Porque viene en formato {"address":<address>,"port":<port>}
    console.log(`Direccion: ${address}, Puerto: ${port}`);

    // Ajustar la dirección si es "::" a "::1" para conexiones locales
    const ipAddress = address === '::' ? '::1' : address;

    // Conectarse al coordinador de grupos que devolvio el asignador de grupos
    const coordinator = new net.Socket()
    coordinator.connect({ port: Number(port), host: ipAddress }, () => {
      console.log(`Connectado al coordinador del grupo ${address}:${port}`)
      coordinator.write('JOIN') // Enviar mensaje al coordinador de grupos pidiendo unirse al grupo que le fue asignado
    })

    // Manejar mensajes recibidos del coordinador de grupos
    coordinator.on("data", (data) => {
      console.log('Mensaje recibido del coordinador:', data.toString());
      coordinator.write('ACK'); // Enviar ACK al coordinador de grupos
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

asignationServer.on("error", (err) => {
  console.error('Error en la conexión al servidor de asignacion de grupos:', err.message);
});
