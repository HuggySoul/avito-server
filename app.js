const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const ItemTypes = {
	REAL_ESTATE: "Недвижимость",
	AUTO: "Авто",
	SERVICES: "Услуги",
};

const app = express();
app.use(bodyParser.json());

// middleware для разрешения кросс-доменных запросов
app.use(
	cors({
		origin: "http://localhost:8080",
	})
);

// In-memory хранилище для объявлений
let items = [
	{
		id: 3,
		name: "Квартира в центре",
		description: "Просторная квартира в центре города",
		location: "Москва",
		type: "Недвижимость",
		propertyType: "Квартира",
		area: 100,
		rooms: 3,
		price: 15000000,
	},
	{
		id: 1,
		name: "Toyota Camry",
		description: "Надежный автомобиль",
		location: "Москва",
		type: "Авто",
		brand: "Toyota",
		model: "Camry",
		year: 2020,
		mileage: 15000,
	},
	{
		id: 2,
		name: "Ремонт квартир",
		description: "Качественный ремонт квартир",
		location: "Москва",
		type: "Услуги",
		serviceType: "Ремонт",
		experience: 5,
		cost: 50000,
		workSchedule: "Пн-Пт, 9:00-18:00",
	},
];

const makeCounter = () => {
	let count = 0;
	return () => count++;
};

const itemsIdCounter = makeCounter();

// Создание нового объявления
app.post("/items", (req, res) => {
	const { name, description, location, type, ...rest } = req.body;

	// Validate common required fields
	if (!name || !description || !location || !type) {
		return res.status(400).json({ error: "Missing required common fields" });
	}

	switch (type) {
		case ItemTypes.REAL_ESTATE:
			if (!rest.propertyType || !rest.area || !rest.rooms || !rest.price) {
				return res.status(400).json({ error: "Missing required fields for Real estate" });
			}
			break;
		case ItemTypes.AUTO:
			if (!rest.brand || !rest.model || !rest.year || !rest.mileage) {
				return res.status(400).json({ error: "Missing required fields for Auto" });
			}
			break;
		case ItemTypes.SERVICES:
			if (!rest.serviceType || !rest.experience || !rest.cost) {
				return res.status(400).json({ error: "Missing required fields for Services" });
			}
			break;
		default:
			return res.status(400).json({ error: "Invalid type" });
	}

	const item = {
		id: itemsIdCounter(),
		name,
		description,
		location,
		type,
		...rest,
	};

	items.push(item);
	res.status(201).json(item);
});

// Получение всех объявлений
app.get("/items", (req, res) => {
	res.json(items);
});

// Получение объявления по его id
app.get("/items/:id", (req, res) => {
	const item = items.find((i) => i.id === parseInt(req.params.id, 10));
	if (item) {
		res.json(item);
	} else {
		res.status(404).send("Item not found");
	}
});

// Обновление объявления по его id
app.put("/items/:id", (req, res) => {
	const item = items.find((i) => i.id === parseInt(req.params.id, 10));
	if (item) {
		Object.assign(item, req.body);
		res.json(item);
	} else {
		res.status(404).send("Item not found");
	}
});

// Удаление объявления по его id
app.delete("/items/:id", (req, res) => {
	const itemIndex = items.findIndex((i) => i.id === parseInt(req.params.id, 10));
	if (itemIndex !== -1) {
		items.splice(itemIndex, 1);
		res.status(204).send();
	} else {
		res.status(404).send("Item not found");
	}
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
