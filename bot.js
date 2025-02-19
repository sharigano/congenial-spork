const { createCanvas, registerFont } = require('canvas');
const TelegramBot = require('node-telegram-bot-api');
const { Readable } = require('stream');

const TOKEN = '7843124311:AAE_3yGN6Nk64GKT58sU4I5w0KVDy988JdQ';
const bot = new TelegramBot(TOKEN, { polling: true });

const FONT_PATH = 'Montserrat.ttf'; // Указываем путь к файлу шрифта
registerFont(FONT_PATH, { family: 'CustomFont' }); // Регистрируем шрифт

const users = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        return sendStartMessage(chatId);
    }

    if (!users[chatId] || !users[chatId].waitingForText) return;

    users[chatId].text = text;
    users[chatId].waitingForText = false;
    
    bot.sendMessage(chatId, 'Выберите тип продукта:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Экран уличный', callback_data: '#FF9500' }, { text: 'Экран для помещения', callback_data: '#30B0C7' }],
                [{ text: 'Медиафасад', callback_data: '#AF52DE' }, { text: 'Дорожные табло', callback_data: '#FF2D55' }],
                [{ text: 'Видеопилон', callback_data: '#A2845E' }, { text: 'Медиакуб', callback_data: '#34C759' }],
                [{ text: 'Другое', callback_data: '#5856D6' }],
                [{ text: 'Закрытый проект', callback_data: '#626262' }],
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const color = query.data;
    
    if (!users[chatId] || !users[chatId].text) return;
    
    const text = users[chatId].text;

    try {
        const size = 1280; // Размер фона
        const rectSize = 1120; // Размер квадрата
        const radius = 330; // Радиус закругления углов
        const paddingX = (size - rectSize) / 2;
        const paddingY = (size - rectSize) / 2;

        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Фон (цвет, выбранный пользователем)
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);

        // Белый квадрат с закругленными углами
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(paddingX + radius, paddingY);
        ctx.lineTo(paddingX + rectSize - radius, paddingY);
        ctx.quadraticCurveTo(paddingX + rectSize, paddingY, paddingX + rectSize, paddingY + radius);
        ctx.lineTo(paddingX + rectSize, paddingY + rectSize - radius);
        ctx.quadraticCurveTo(paddingX + rectSize, paddingY + rectSize, paddingX + rectSize - radius, paddingY + rectSize);
        ctx.lineTo(paddingX + radius, paddingY + rectSize);
        ctx.quadraticCurveTo(paddingX, paddingY + rectSize, paddingX, paddingY + rectSize - radius);
        ctx.lineTo(paddingX, paddingY + radius);
        ctx.quadraticCurveTo(paddingX, paddingY, paddingX + radius, paddingY);
        ctx.closePath();
        ctx.fill();

        // Текст (такого же цвета, как фон)
        ctx.font = 'bold 340px "CustomFont"';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2);

        // Отправляем изображение
        const buffer = canvas.toBuffer('image/png');
        const stream = Readable.from(buffer);
        await bot.sendPhoto(chatId, stream);

        sendStartMessage(chatId); // Запуск заново
    } catch (error) {
        bot.sendMessage(chatId, 'Ошибка при обработке изображения.');
        console.error(error);
    }
});

function sendStartMessage(chatId) {
    users[chatId] = { text: '', color: 'black', waitingForText: false };
    bot.sendMessage(chatId, 'Чтобы создать изображение, нажмите кнопку ниже:', {
        reply_markup: {
            inline_keyboard: [[{ text: 'Старт', callback_data: 'start' }]]
        }
    });
}

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'start') {
        users[chatId].waitingForText = true;
        bot.sendMessage(chatId, 'Введите последние 4 цифры номера проекта.\n\Например: 00ФР-00[0225]');
    }
});