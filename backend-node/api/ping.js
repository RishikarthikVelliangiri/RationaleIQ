export default function handler(req, res) {
  console.log('Ping endpoint hit!');
  res.status(200).send('pong');
}
