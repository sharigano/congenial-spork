const TelegramBot = require('node-telegram-bot-api');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

// Вставьте сюда ваш токен
const token = '7843124311:AAE_3yGN6Nk64GKT58sU4I5w0KVDy988JdQ';
const bot = new TelegramBot(token, { polling: true });

// Путь к исходному изображению
const IMAGE_PATH = 'base_image.png';

// Цвета для текста
const COLORS = {
    "Красный": "#FF0000",
    "Зеленый": "#00FF00",
    "Синий": "#0000FF",
    "Желтый": "#FFFF00",
};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        keyboard: [["Красный", "Зеленый"], ["Синий", "Желтый"]],
        one_time_keyboard: true,
    };
    bot.sendMessage(chatId, "Привет! Выбери цвет текста:", {
        reply_markup: keyboard,
    });
    // Сохраняем состояние выбора цвета
    bot.userData = bot.userData || {};
    bot.userData[chatId] = { waitingForColor: true };
});

// Обработчик текстовых сообщений
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userText = msg.text;

    if (!bot.userData[chatId]) {
        bot.userData[chatId] = {};
    }

    // Проверяем, ожидаем ли мы выбор цвета
    if (bot.userData[chatId].waitingForColor) {
        if (COLORS[userText]) {
            // Сохраняем выбранный цвет
            bot.userData[chatId].color = COLORS[userText];
            bot.userData[chatId].waitingForColor = false;
            bot.sendMessage(chatId, "Теперь отправь текст, который нужно нанести на изображение.");
        } else {
            bot.sendMessage(chatId, "Пожалуйста, выбери цвет из предложенных кнопок.");
        }
    } else {
        // Получаем цвет из контекста
        const color = bot.userData[chatId].color || "#FFFF00"; // По умолчанию желтый
        const outputPath = "output_image.png";

        // Наносим текст на изображение
        await addTextToImage(userText, color, outputPath);

        // Отправляем изображение пользователю
        bot.sendPhoto(chatId, fs.readFileSync(outputPath));

        // Удаляем временное изображение
        fs.unlinkSync(outputPath);
    }
});

// Функция для нанесения текста на изображение
async function addTextToImage(text, color, outputPath) {
    // Загружаем изображение
    const image = await loadImage(IMAGE_PATH);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Рисуем изображение на холсте
    ctx.drawImage(image, 0, 0);

    // Настройки шрифта
    const { registerFont } = require('canvas');
    registerFont('Montserrat.ttf', { family: 'Semibold' }); 
    ctx.font = '30px Montserrat';
    ctx.fillStyle = color;

    // Рисуем текст на изображении
    ctx.fillText(text, 10, 50);

    // Сохраняем изображение
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => console.log('Изображение сохранено.'));
}