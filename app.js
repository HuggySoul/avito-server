const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const ItemTypes = {
	REAL_ESTATE: "Недвижимость",
	AUTO: "Авто",
	SERVICES: "Услуги",
};

const app = express();
// Внимательно с размером тела запроса! Картинки в Base64 могут много весить!
app.use(bodyParser.json({ limit: "10mb" }));

// middleware для разрешения кросс-доменных запросов
app.use(
	cors({
		origin: "http://localhost:8080",
	})
);

// In-memory хранилище для объявлений
let items = [
	{
		id: 9,
		name: "Квартира",
		description: "Просторная квартира в центре города",
		location: "Москва",
		type: "Недвижимость",
		propertyType: "Квартира",
		area: 100,
		rooms: 3,
		price: 15000000,
	},
	{
		id: 7,
		name: "Квартира не в центре",
		description: "Просторная квартира не центре не города",
		location: "Рязань",
		type: "Недвижимость",
		propertyType: "Квартира",
		area: 400,
		rooms: 6,
		price: 12000000,
	},
	{
		id: 8,
		name: "Дом за городом",
		description: "Просторный дом",
		location: "Новосибирск",
		type: "Недвижимость",
		propertyType: "Дом",
		area: 200,
		rooms: 6,
		price: 8000000,
	},
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
		id: 10,
		name: "Toyota Land Cruiser",
		description: "Надежный автомобиль",
		location: "Москва",
		type: "Авто",
		brand: "Toyota",
		model: "Land Cruiser",
		year: 2010,
		mileage: 200000,
	},
	{
		id: 5,
		name: "Haval H6",
		description: "Надежный автомобиль",
		location: "Новосибирск",
		type: "Авто",
		brand: "Haval",
		model: "H6",
		year: 2019,
		mileage: 60000,
	},
	{
		id: 6,
		name: "Suzuki Swift",
		description: "Летает в космос за литр водки",
		location: "Новосибирск",
		type: "Авто",
		brand: "Suzuki",
		model: "Swift",
		year: 2015,
		mileage: 110000,
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
	{
		id: 4,
		name: "Уборщица квартир",
		description: "Качественный ремонт квартир",
		location: "Сочи",
		type: "Услуги",
		serviceType: "Уборка",
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

// Пагинация
const paginateItems = (page, limit, allItems) => {
	page = parseInt(page, 10); // номер страницы
	limit = parseInt(limit, 10); // максимальное количество элементов на странице

	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;

	return allItems.slice(startIndex, endIndex);
};

//Фильтрация объявлений по типу
const filterItemsByType = (adTypeFilter, items) => {
	return adTypeFilter ? items.filter((item) => item.type === adTypeFilter) : items;
};

// Получение всех объявлений c пагинацией
app.get("/items", (req, res) => {
	let { page = 1, limit = 5, adTypeFilter = null } = req.query;

	const filteredItems = filterItemsByType(adTypeFilter, items);
	const paginatedItems = paginateItems(page, limit, filteredItems);
	res.json({
		items: paginatedItems,
		total: items.length,
		page,
		totalPages: Math.ceil(items.length / limit),
	});
});

// Поиск объявлений по называнию c пагинацией и фильтрацией
app.get("/items/search", (req, res) => {
	const { name, page = 1, limit = 5, adTypeFilter = null } = req.query;

	if (!name) return res.status(400).json({ error: "Query parameter 'name' is required" });

	const searchedItems = items.filter((item) =>
		item.name.toLowerCase().includes(name.toLowerCase())
	);

	const filteredItems = filterItemsByType(adTypeFilter, searchedItems);
	const paginatedItems = paginateItems(page, limit, filteredItems);

	res.json({ items: paginatedItems, total: filteredItems.length });
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
