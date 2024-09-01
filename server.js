import net from "net";
import { readBytes, groupAmount } from "./auxiliares.js";

const clientsGroups = new Map(); // Mapa de grupos con sus respectivos clientes, formato numero de grupo -> lista de clientes (array)
const coordinators = []; // Array de servidores (coordinadores) para cada grupo

function multicast(group, message, callback) {
  const clients = clientsGroups.get(group) || [];
  const acks = new Set();

  console.log(`Enviando mensaje a ${clients.length} clientes del grupo ${group}`);
  clients.forEach((client, index) => {
    client.write(message, () => {
      client.once("data", (ack) => {
        if (ack.toString() !== "ACK") {
          console.error("Mensaje no recibido por el cliente", index);
          callback(false);
          return;
        }

        acks.add(index);
        if (acks.size === clients.length) {
          callback(true);
        }
      })
    }); 
  });

  setTimeout(() => {
    if (acks.size !== clients.length) {
      callback(false);
      console.error("Timeout: no se recibio ACK de todos los clientes");
    }
  }, 5000); // 5 segundos de timeout para recibir todos los ACKs de los clientes, sino se considera que no se recibieron todos los mensajes
}

// Crea un coordinador de grupo
function createCoordinator(group, port) {
  const coordinator = net.createServer((socket) => {
    socket.on("data", (data) => {
      const message = readBytes(data, 0, data.length).toString("utf-8");

    // Si es un cliente que se quiere unir al grupo, se agrega al map del grupo
    if (message === "JOIN"){
      if (!clientsGroups.has(group)) {
        clientsGroups.set(group, []);
      }
      
      clientsGroups.get(group).push(socket);
    } else if (message.startsWith("SEND")) {
      // Si es un cliente que quiere enviar un mensaje al grupo, se obtiene el mensaje y se enviara a todos los clientes del grupo
      const messageToGroup = readBytes(data, 4, data.length);
      console.log(`Mensaje recibido del cliente: ${message.toString()}`);
      // Enviar el mensaje y responder con un ACK / NACK
      multicast(group, messageToGroup, (success) => { 
        if (!success) {
          socket.end('Error al enviar mensaje al grupo '+group.toString())
          return;
        }

        socket.write('Mensaje enviado al grupo '+group.toString())
      });
    } else if (message === "CLOSE"){
      socket.end('Desconectado del coordinador '+group.toString());
    }
  });

    socket.on("end", () => {
      // Remover cliente del grupo al desconectarse
      const clients = clientsGroups.get(group);
      if (clients) {
        const index = clients.indexOf(socket);
        if (index !== -1) clients.splice(index, 1);
      }
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      // socket.end('Ocurrio un error en el coordinador de grupo '+group.toString());
    });
  });

  coordinator.listen(port, () => {
    console.log(`Coordinador para el grupo ${group} escuchando en el puerto ${port}`);
  });

  coordinators.push(coordinator);
}

// Crear varios coordinadores para diferentes grupos
for (let i = 1; i <= groupAmount; i++) {
  createCoordinator(i, 8080 + i); // Coordinador para el grupo i en el puerto 8000 + i
}

// Servidor de grupos
const groupServer = net.createServer((socket) => {
  // El servidor de grupos recibira el numero de grupo al que se quiere conectar el cliente y le enviara la direccion y puerto del coordinador de ese grupo para que se conecte a el.
  socket.on("data", (data) => {
    console.log(data)
    const message = readBytes(data, 0, data.length);
    const group = message.toString("utf-8");

    if (isNaN(Number(group)) || group < 1 || group > groupAmount) {
      socket.end(`Grupo no valido, grupos disponibles del 1 al ${groupAmount}`);
      return;
    }

    const coordinator = coordinators[group - 1]; // Recupera el coordinador del grupo
    const address = coordinator.address();

    // Envia la direccion y puerto del coordinador de grupos al cliente
    socket.end(JSON.stringify({"address":address.address,"port":address.port}));
  });

  socket.on("end", () => {
    console.log('Cliente desconectado')
  });
});

groupServer.listen(8080);

// Asigno un grupo random del 1 al 3 a cada cliente que llega, se agrega al map de grupos y le envio un mensaje al cliente
function assignGroup(socket) {
  const group = Math.floor(Math.random() * groupAmount) + 1;
  // Al conectar un cliente, añadirlo al grupo correspondiente
  const coordinator = coordinators[group - 1]; // Recupera el coordinador del grupo
  const address = coordinator.address();

  // Envia la direccion y puerto del coordinador que le fue asignado
  socket.end(JSON.stringify({"address":address.address,"port":address.port}));
}

const serverGroupAssignator = net.createServer((socket) => {
  console.log("Nuevo cliente para asignar grupo en puerto ", socket.remotePort);

  // Asignar un grupo al cliente
  assignGroup(socket);
});

serverGroupAssignator.listen(8888);