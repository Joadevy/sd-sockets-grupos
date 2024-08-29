import net from "./node_modules/index.js"

// a) Utilizando sockets programe un sistema de comunicación multicast y tenga en cuenta las siguientes
// características:
// - Atomicidad de los mensajes
// - un nodo coordinado central para los mensajes externos al grupo considerado.
// b) Arme un grupo de maquinas (de tres nodos), asigne direcciones de grupo a cada nodo y envíe un
// mensaje al grupo. El mensaje puede ser simplemente un número entero o una cadena de caracteres.
// c) utilice una Cuarta Computadora para enviar mensajes desde el exterior al grupo.


// TODO: // Hacer que el cliente se comunique con el servidor de grupos y le pase el nombre del grupo al que se quiere conectar. Este servidor le envia la direccion y puerto conocido del coordinador del grupo con el que se quiere comunicar. 
// El cliente luego le envia el mensaje al coordinador del grupo y el coordinador del grupo lo multicastea a cada uno de los grupos.

function multicast(message) {
  clients.forEach((client) => {
    client.write(message + '\n');  // El delimitador sirve para la atomicidad y para que el servidor pueda leer los mensajes
  });
}

function readBytes (buffer, offset, length) {
  return buffer.slice(offset, offset + length)
}

const externalMessages = [];
const clients = [
  net.createConnection({ port: 59092 }),
  net.createConnection({ port: 59093 }),
  net.createConnection({ port: 59094 }),
];

// Mapa de clientes con sus respectivos grupos
const clientsWithGroups = new Map();

// Asignación de grupos
clientsWithGroups.set(clients[0], 1);
clientsWithGroups.set(clients[1], 2);
clientsWithGroups.set(clients[2], 1);

// Nodo coordinador central
const coordinator = net.createServer((socket) => {
  socket.on("data", (data) => {
    const message = readBytes(data, 0, data.length);
    // Aqui deberia detectar el grupo al que se quiere comunicar el cliente
    const group = message[0]

    // luego deberia obtener el mensaje como tal que se quiere enviar a  cada miembro del grupo

    // enviar el mensaje solo a esos elementos del grupo
    multicast(message); // Reenvía el mensaje al grupo
  });
});

coordinator.listen(59091, '127.0.0.1');  // Escucha conexiones externas en otro puerto

// Servidor multicast
const server = net.createServer((socket) => {
  clients.push(socket);

  socket.on("data", (data) => {
    const message = readBytes(data, 0, data.length);
    multicast(message, socket);  // Reenvía el mensaje al grupo
  });

  socket.on("end", () => {
    const index = clients.indexOf(socket);
    if (index !== -1) clients.splice(index, 1);
  });
});

server.listen(59090);
