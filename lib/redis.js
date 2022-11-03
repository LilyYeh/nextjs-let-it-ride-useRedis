import { Client, Entity, Schema, Repository } from 'redis-om';

const client = new Client();

async function connect() {
	if (!client.isOpen()) {
		console.log(123)
		await client.open(process.env.REDIS_URL);
	}
}

class Car extends Entity {}
let schema = new Schema(
	Car,
	{
		make: { type: 'string' },
		model: { type: 'string' },
		image: { type: 'string' },
		description: { type: 'string', textSearch: true },
	},
	{
		dataStructure: 'JSON',
	}
);

export async function createCar(data) {
	await connect();

	const repository = client.fetchRepository(schema);

	const car = repository.createEntity(data);

	const id = await repository.save(car);
	console.log(id)
	return id;
}