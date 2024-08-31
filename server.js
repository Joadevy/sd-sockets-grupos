import net from "net";

// a) Utilizando sockets programe un sistema de comunicación multicast y tenga en cuenta las siguientes
// características:
// - Atomicidad de los mensajes
// - un nodo coordinado central para los mensajes externos al grupo considerado.
// b) Arme un grupo de maquinas (de tres nodos), asigne direcciones de grupo a cada nodo y envíe un
// mensaje al grupo. El mensaje puede ser simplemente un número entero o una cadena de caracteres.
// c) utilice una Cuarta Computadora para enviar mensajes desde el exterior al grupo.


// TODO: // Hacer que el cliente se comunique con el servidor de grupos y le pase el nombre del grupo al que se quiere conectar. Este servidor le envia la direccion y puerto conocido del coordinador del grupo con el que se quiere comunicar. 
// El cliente luego le envia el mensaje al coordinador del grupo y el coordinador del grupo lo multicastea a cada uno de los grupos.

const groupAmount = 3; // Cantidad de grupos
const clientsGroups = new Map(); // Mapa de grupos con sus respectivos clientes
const coordinators = []; // Lista de servidores (coordinadores) para cada grupo

function multicast(group, message) {
  const clients = clientsGroups.get(group) || [];
  clients.forEach((client) => {
    client.write(message); 
  });
}

function readBytes(buffer, offset, length) {
  return buffer.slice(offset, offset + length);
}

// Crea un coordinador de grupo
function createCoordinator(group, port) {
  const coordinator = net.createServer((socket) => {
    socket.on("data", (data) => {
      const message = readBytes(data, 0, data.length);

      // Enviar el mensaje solo a esos elementos del grupo
      multicast(group, message);
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

// Asigno un grupo random del 1 al 3 a cada cliente que llega, se agrega al map de grupos y le envio un mensaje al cliente
function assignGroup(socket) {
  const group = Math.floor(Math.random() * groupAmount) + 1;
  // Al conectar un cliente, añadirlo al grupo correspondiente
  if (!clientsGroups.has(group)) {
    clientsGroups.set(group, []);
  }
  clientsGroups.get(group).push(socket);
  socket.write('Le fue asignado el grupo: '+group.toString()+"\n");
}

// Servidor de grupos
const server = net.createServer((socket) => {
  console.log("New client on port ", socket.remotePort);
  // Le asigna un grupo al cliente
  assignGroup(socket);

  // El servidor de grupos recibira el numero de grupo al que se quiere conectar el cliente y le enviara la direccion y puerto del coordinador de ese grupo para que se conecte a el.
  socket.on("data", (data) => {
    console.log(data)
    const message = readBytes(data, 0, data.length);
    const group = message.toString("utf-8");

    console.log(group);

    if (isNaN(Number(group)) || group < 1 || group > groupAmount) {
      socket.write("Grupo no valido");
      return;
    }

    const coordinator = coordinators[group - 1]; // Recupera el coordinador del grupo
    const address = coordinator.address();
    socket.write(`${address.address}:${address.port}`);
  });

  socket.on("end", () => {
    console.log('Cliente desconectado')
  });
});

server.listen(8080);
