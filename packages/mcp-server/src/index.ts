import { MemoryMeshServer } from './server';

async function main() {
  const server = new MemoryMeshServer();
  await server.start();
}

main().catch((error) => {
  console.error('Fatal error starting MemoryMesh:', error);
  process.exit(1);
});