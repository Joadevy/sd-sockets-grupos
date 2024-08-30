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

const clients = [];

function multicast(message) {
  clients.forEach((client) => {
    client.write(message); 
  });
}

function readBytes (buffer, offset, length) {
  return buffer.slice(offset, offset + length)
}
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

// Asigno un grupo random del 1 al 3 a cada cliente que llega y lo empujo a la lista de clientes
function assignGroup(socket) {
  const group = Math.floor(Math.random() * 3) + 1;
  socket.write(group.toString()+"\n");
}


// Servidor multicast
const server = net.createServer((socket) => {
  clients.push(socket);
  console.log("New client on port ", socket.remotePort);
  console.log(socket)

  socket.on("data", (data) => {
    console.log(data)
    const message = readBytes(data, 0, data.length);
    // multicast(message, socket);  // Reenvía el mensaje al grupo
      console.log(message.toString("utf-8"))
      assignGroup(socket);
      socket.write(`Estas conectado junto a ${clients.length} clientes: ${clients.map((client) => JSON.stringify({"dir":client.localAddress, "port":client.remotePort}))} ${"\n"}`);
  });

  socket.on("end", () => {
    const index = clients.indexOf(socket);
    if (index !== -1) clients.splice(index, 1);
  });
});

server.listen(59090);
