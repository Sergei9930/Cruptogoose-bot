require('dotenv').config();

const fs = require('fs'); const path = require('path'); // Подключаем Telegraf вместе с middleware session const { Telegraf, Markup, session } = require('telegraf'); const lang = require('./lang');

// Путь к файлу с настройками пользователей const usersFile = path.resolve(__dirname, 'users.json');

function loadUsers() { try { return JSON.parse(fs.readFileSync(usersFile, 'utf8')); } catch (e) { return {}; } }

function saveUsers(users) { fs.writeFileSync(usersFile, JSON.stringify(users, null, 2)); }

// Инициализация бота const bot = new Telegraf(process.env.BOT_TOKEN);

// Подключаем сессии bot.use(session());

// Middleware: загружаем сохранённый язык пользователя bot.use((ctx, next) => { if (ctx.from && ctx.from.id) { const users = loadUsers(); const userLang = users[ctx.from.id]; if (userLang) ctx.session.lang = userLang; } return next(); });

// Команда /start bot.start((ctx) => { if (ctx.session.lang) { const { messages, buttons } = lang[ctx.session.lang]; return ctx.reply( messages.main_menu, Markup.inlineKeyboard([ [Markup.callbackButton(buttons.signals, 'cmd_signals')], [Markup.callbackButton(buttons.funding, 'cmd_funding')], [Markup.callbackButton(buttons.arbitrage, 'cmd_arbitrage')] ]) ); } // Если язык не выбран – показываем клавиатуру выбора ctx.session.lang = 'ru'; return ctx.reply( lang.ru.messages.choose_language, Markup.keyboard([ [lang.ru.buttons.russian, lang.ru.buttons.ukrainian], [lang.ru.buttons.english] ]).resize().oneTime() ); });

// Обработчики выбора языка bot.hears(lang.ru.buttons.russian, (ctx) => selectLanguage(ctx, 'ru')); bot.hears(lang.uk.buttons.ukrainian, (ctx) => selectLanguage(ctx, 'uk')); bot.hears(lang.en.buttons.english, (ctx) => selectLanguage(ctx, 'en'));

function selectLanguage(ctx, code) { ctx.session.lang = code; const users = loadUsers(); users[ctx.from.id] = code; saveUsers(users);

const { messages, buttons } = lang[code]; return ctx.reply( messages.main_menu, Markup.inlineKeyboard([ [Markup.callbackButton(buttons.signals, 'cmd_signals')], [Markup.callbackButton(buttons.funding, 'cmd_funding')], [Markup.callbackButton(buttons.arbitrage, 'cmd_arbitrage')] ]) ); }

// Callback-обработчики разделов bot.action('cmd_signals', (ctx) => ctx.reply(lang[ctx.session.lang].messages.signals_info)); bot.action('cmd_funding', (ctx) => ctx.reply(lang[ctx.session.lang].messages.funding_info)); bot.action('cmd_arbitrage', (ctx) => ctx.reply(lang[ctx.session.lang].messages.arbitrage_info));

// Запуск бота bot.launch();

// Корректная остановка process.once('SIGINT', () => bot.stop('SIGINT')); process.once('SIGTERM', () => bot.stop('SIGTERM'));
