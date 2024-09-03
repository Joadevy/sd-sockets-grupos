![](https://res.cloudinary.com/dkjkgri6x/image/upload/v1725223376/Screenshot_2024-09-01_at_5.42.15_PM_zewua1.png)

## Objetivo de la aplicacion
Simular una conexion uno a muchos entre un proceso externo y un grupo de procesos en un sistema distribuido utilizando sockets TCP. Esto se conoce como una comunicacion de grupo abierto.

## Logica de la comunicacion
Se cuenta con una arquitectura de cliente externo - servidor de grupos - coordinador de grupos - grupo. El cliente externo se comunicara con un grupo de proceso y para ello envia el numero de grupo a conectarse al servidor de grupos, este le responde con la direccion y puerto del coordinador del grupo al que tiene que conectarse. Al conectarse al coordinador, le envia el mensaje que quiere hacer llegar a los miembros del grupo. El coordinador distribuye el mensaje entre los miembros del grupo, recibiendo un paquete ACK (Acknowledgment) por cada miembro para confirmar la recepcion. Una vez confirmados todos los paquetes, se envia un ACK al cliente externo confirmando el envio exitoso del mensaje a todos los miembros del grupo.

## Componentes

### Servidor de grupos
Encargado de gestionar el redireccionamiento del cliente externo al respectivo coordinador del grupo. Recibe numero de grupos y devuelve direccion y puerto del coordinador.

### Coordinador de grupo
Encargado de gestionar el grupo de procesos. Recibe mensajes de clientes externos para hacer multicast a los miembros de su grupo, devolviendo ACK de confirmacion al cliente externo.

### Asignador de grupo
Encargado de asignar un nuevo cliente interno a un grupo. Recibe solicitudes de asignacion y devuelve la direccion y puerto del coordinador del grupo al que fue asignado.

### Cliente interno
Proceso que se conectara con el coordinar para ser parte de un grupo y recibira mensajes de clientes externos.

### Cliente externo
Proceso que se conectara, en primera instancia con el servidor de grupos, luego al coordinador de grupos y enviara mensajes a los miembros de un grupo.


## Como ejecutar
Esta pensado para ejecutar directamente en la terminal usando node o el equivalente en el entorno de ejecucion de javascript de preferencia (se utilizo bun particularmente). se propone una "interactividad" en el cliente externo donde podra elegir a que grupo enviar y el contenido de los mensajes.

1. En la primera terminal, ejecuta el servidor:
   ```bash
   node server.js
   ```
2. En la segunda terminal, ejecuta un cliente interno, que sera una aplicacion que sera asignada a un grupo, y la aplicacion se conectara e su coordinado de grupo asignado. Esto puede repetirse tantas veces como aplicaciones en grupos desee tener.
    ```bash
   node internalClient.js
   ```
3. En la tercera terminal, ejecuta un cliente externo, esta sera una aplicacion externa que se querra comunicar con algun grupo para enviarle un mensaje a todos los procesos miembros del grupo.
   ```bash
   node externalClient.js
   ```

