const TelegramBot = require('node-telegram-bot-api');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const TOKEN = '7843124311:AAE_3yGN6Nk64GKT58sU4I5w0KVDy988JdQ';
const bot = new TelegramBot(TOKEN, { polling: true });

const IMAGE_PATH = path.join(__dirname, 'base_image.png');
const FONT_PATH = path.join(__dirname, 'Montserrat.ttf'); // Путь к шрифту
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
    bot.sendMessage(chatId, 'Выберите цвет текста:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Черный', callback_data: 'black' }, { text: 'Белый', callback_data: 'white' }],
                [{ text: 'Красный', callback_data: 'red' }, { text: 'Синий', callback_data: 'blue' }]
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const color = query.data;
    
    if (!users[chatId] || !users[chatId].text) return;
    
    users[chatId].color = color;
    const text = users[chatId].text;
    
    try {
        const image = await loadImage(IMAGE_PATH);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(image, 0, 0);
        ctx.font = '340px "CustomFont"'; // Увеличиваем размер шрифта
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const buffer = canvas.toBuffer('image/jpeg');
        const stream = Readable.from(buffer);
        await bot.sendPhoto(chatId, stream);
        
        sendStartMessage(chatId); // Запуск процесса заново
    } catch (error) {
        bot.sendMessage(chatId, 'Произошла ошибка при обработке изображения.');
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
        bot.sendMessage(chatId, 'Введите номер проекта');
    }
});

