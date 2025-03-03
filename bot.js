const { createCanvas, loadImage, registerFont } = require('canvas');
const TelegramBot = require('node-telegram-bot-api');
const { Readable } = require('stream');

const TOKEN = '7209878207:AAE122wsge0m77tG2adrlcC6EFpriqsNh0Q';
const bot = new TelegramBot(TOKEN, { polling: true });

const FONT_PATH = 'Montserrat.ttf';
registerFont(FONT_PATH, { family: 'CustomFont' });

const IMAGE_DATA = {
    'Экран уличный': { image: 'images/street_screen.png', color: '#28b7dd' },
    'Экран для помещения': { image: 'images/indoor_screen.png', color: '#efa329' },
    'Медиафасад': { image: 'images/media_facade.png', color: '#ff2d55' },
    'Дорожные табло': { image: 'images/road_sign.png', color: '#af52de' },
    'Видеопилон': { image: 'images/video_pilon.png', color: '#8fd130' },
    'Медиакуб': { image: 'images/media_cube.png', color: '#22c6a6' },
    'Другое': { image: 'images/other.png', color: '#5856D6' },
    'Закрытый проект, на гарантии': { image: 'images/closed_project_on_varanty.png', color: '#2645bb' },
    'Закрытый проект, гарантия окончена': { image: 'images/closed_project_varanty_over.png', color: '#2645bb' },
};

const users = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start' || text === 'Старт') {
        users[chatId] = { waitingForText: true };
        return bot.sendMessage(chatId, 'Введите последние 4 цифры номера проекта.\nНапример: 00ФР-00[0225]', {
            reply_markup: { remove_keyboard: true },
        });
    }

    if (users[chatId]?.waitingForText) {
        users[chatId].text = text;
        users[chatId].waitingForText = false;

        return bot.sendMessage(chatId, 'Выберите тип продукта:', {
            reply_markup: {
                keyboard: [
                    ['Экран уличный', 'Экран для помещения'],
                    ['Медиафасад', 'Дорожные табло'],
                    ['Видеопилон', 'Медиакуб'],
                    ['Другое'],
                    ['Закрытый проект, на гарантии', 'Закрытый проект, гарантия окончена'],
                ],
                resize_keyboard: true,
                one_time_keyboard: true,
            }
        });
    }

    if (!users[chatId]?.text) return;

    const product = IMAGE_DATA[text];
    if (!product) return; // Если пользователь ввел текст, не соответствующий кнопкам, игнорируем

    try {
        const size = 1000;
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Загружаем фоновое изображение
        const backgroundImage = await loadImage(product.image);
        ctx.drawImage(backgroundImage, 0, 0, size, size);

        // Текст
        ctx.font = 'bold 250px "CustomFont"';
        ctx.fillStyle = product.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(users[chatId].text, 500, 770
        );

        // Отправляем изображение
        const buffer = canvas.toBuffer('image/png');
        const stream = Readable.from(buffer);
        await bot.sendPhoto(chatId, stream);

        sendStartMessage(chatId);
    } catch (error) {
        bot.sendMessage(chatId, 'Ошибка при обработке изображения.');
        console.error(error);
    }
});

function sendStartMessage(chatId) {
    bot.sendMessage(chatId, 'Чтобы создать новое изображение, нажмите "Старт".', {
        reply_markup: {
            keyboard: [[{ text: 'Старт' }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        }
    });
}
