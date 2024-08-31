// A client for the date server.
//
// Example usage:
//
//   node dateclient.js 10.0.1.40

import net from "net"

const client = new net.Socket()
client.connect({ port: 8080, host: process.argv[2] ?? "localhost" }, () => {
  console.log("Connected to server")
  client.write("Hello, server! I'm a client")
})

client.on("data", (data) => {
  console.log(data.toString("utf-8"))
})