process.env.NTBA_FIX_319 = 1;

// переменные приложения
// заявки
let requests = [],
	users = {},
	sessions = {};

const fs        	= require('fs');
const moment        = require('moment');
const mail          = require('./mail');
const botConfig		= require('./config.json');

/*
let botConfig = {	
		passwords: [''], # passwords
		mailto: [''], # info emails
		botToken: ''
};
*/
// подключаем телеграм
	let TelegramBot = require('node-telegram-bot-api');

    // Устанавливаем токен
    let token = botConfig.botToken;
    // Включить опрос сервера
    const bot = new TelegramBot(token, {polling: true});

	// задаём кнопки
	let options = {
      reply_markup: JSON.stringify({
        keyboard: [
          [{ text: 'Новая заявка'}],
          [{ text: 'Инструкция'}]          
        ]
      })
    };
	
	// биндим /help
	
	bot.onText(/\/help/, function (msg, match) {
		let fromId = msg.from.id;
		bot.sendMessage(fromId, 'help', options);
	
    });
	
	bot.onText(/\/start/, function (msg, match) {
		let fromId = msg.from.id;
		
		bot.sendMessage(fromId, 'нажмите новая заявка для начала отправки данных', options);
	
	});
	
	bot.on('message', (msg) => {
		const chatId = msg.chat.id;
		if(users[chatId] == undefined){
			users[chatId] = msg.chat;
			usersDb.insert(users[chatId], function(err,newDocs){	
				console.log(newDocs);	
			});
		} 
			let answer = getAnswer(msg);
			if (answer.message !== '') {
				if(answer.type == undefined){answer.type = 'common';}
				switch(answer.type){
					case 'common': 
							bot.sendMessage(chatId, answer.message, answer.options).then(function(resp) {
								// ...snip...
								//log.log('resp!!!!: ', resp);
							}).catch(function(error) {
								
							});
					break;
					case 'picture': 
					break;
					case 'skip': 
					break;
				}
				
				
			}				
	});

	// обработка ошибок
	bot.on('polling_error', (error) => {
		console.log(error);  // => 'EFATAL'
	  });
	//

	function getAnswer(msg){
		const fromId = msg.chat.id;
		if (msg.text == 'Новая заявка' && users[fromId].auth) {
			sessions[fromId] = {
				startTime: new Date(),
				fromId: fromId,
				user: msg.chat,
				files: [],
				requestNumber: requests.length
			};
			// folder name: chatId_date
			sessions[fromId].folderName = './public/N'+sessions[fromId].requestNumber+'_'+fromId+'_'+moment().format('YYYYMMDDhhmm');
			try {
				if (!fs.existsSync(sessions[fromId].folderName)){
				  fs.mkdirSync(sessions[fromId].folderName);
				}
			  } catch (err) {
				console.error(err);
			  }
			return {
				message: 'Начало новой заявки '+moment().format('YYYY/MM/DD hh:mm'),
				type: 'common',
				options: {
					reply_markup: JSON.stringify({
					  keyboard: [
						[{ text: 'Закрыть заявку'}],
						[{ text: 'Инструкция'}]          
					  ]
					})
				  }
			};
		}

		if (msg.text == 'Закрыть заявку' && users[fromId].auth) {
			if(sessions[fromId] !== undefined){
				sessions[fromId].endTime = new Date();				
				
				requestsDb.insert(sessions[fromId], function(err,newDocs){	
					sessions[fromId] = undefined;	
					console.log(newDocs);	
					requests.push(newDocs);
					
					for (let key in users) {
						if(users[key].auth){
							let text = '';
							text += 'Размещена новая заявка от пользователя '+newDocs.user.first_name+'. \n';
							text += 'Номер заявки: '+newDocs.requestNumber+'. \n';
							text += 'Файлов в заявке: '+newDocs.files.length+'\n';
							text += 'Папка: ['+newDocs.folderName.split('/')[2]+'](http://api.botboom.ru:4470/'+newDocs.folderName.split('/')[2]+'/)';
							bot.sendMessage(users[key].id, text, {
								parse_mode: 'Markdown',
								reply_markup: JSON.stringify({resize_keyboard: true})
							});
						}
					}

					let html = '<b>Заявка:</b><br>';
							html += 'Размещена новая заявка от пользователя '+newDocs.user.first_name+'. <br>';
							html += 'Номер заявки: '+newDocs.requestNumber+'. <br>';
							html += 'Файлов в заявке: '+newDocs.files.length+'<br>';
							html += 'Папка: http://api.botboom.ru:4470/'+newDocs.folderName.split('/')[2]+'<br>';
					let attachments = [];
					for(let i=0; i < newDocs.files.length; i++){
						attachments.push({
							filename: newDocs.files[i].split('/')[2],
							path: newDocs.files[i],
							cid: 'http://api.botboom.ru:4470/'+newDocs.folderName.split('/')[2]+'/'+newDocs.files[i].split('/')[2]
						});
					}	

					for(let key in botConfig.mailto){
						mail.send(botConfig.mailto[key], 'Заявка '+newDocs.requestNumber, '', html, attachments);
					}

				}); 
				//console.log(sessions[fromId], options);
				return {
					message: 'Заявка закрыта '+moment().format('YYYY/MM/DD hh:mm'),
					type: 'common',
					options: {
						reply_markup: JSON.stringify({
						keyboard: [
							[{ text: 'Новая заявка'}],
							[{ text: 'Инструкция'}]          
						]
						})
					}
				};
			} else {
				return {
					message: 'error',
					type: 'common',
					options: {
						reply_markup: JSON.stringify({
						keyboard: [
							[{ text: 'Новая заявка'}],
							[{ text: 'Инструкция'}]          
						]
						})
					}
				};
			}
		}
		
		if (msg.text == 'Инструкция') {
			return {
				message: 'Нажмите кнопку Новая заявка, пришлите файлы как фото, нажмите Закрыть заявку.\n Заявки можно посмотреть по адресу http://api.botboom.ru:4470/. Для авторизации пришлите команду /auth password, заменив password на дейсствующий пароль.',
				type: 'common',
				options: {
					reply_markup: JSON.stringify({
					keyboard: [
						[{ text: 'Новая заявка'}],
						[{ text: 'Инструкция'}]          
					]
					})
				}
			};
		}

		// авторизация
        if (/\/auth*/.test(msg.text) && msg.text) {
				let authText = '',
					pass = msg.text.split(' ')[1];
                if (botConfig.passwords.indexOf(pass) >= 0 ) {
                    authText = 'Авторизая успешна';                  
                    users[fromId].auth = true;
                    console.log(users[fromId]);
					usersDb.update({_id: users[fromId]._id}, { $set: { auth: true } }, function(err,newDocs){	
						console.log(newDocs);	
					});
                } else {
                    authText = 'не верный пароль';
                }
                return {
                    message: authText,
                    options: {
                        parse_mode : 'Markdown',
                        reply_markup: JSON.stringify({
                            resize_keyboard: true,
                            keyboard: [
									  [{ text: 'Новая заявка'}],
									  [{ text: 'Инструкция'}]          
									]
                        })
                    }
                };
			}
			
		// отмена авторизации
        if (/\/deauth*/.test(msg.text) && msg.text) {
			users[fromId].auth = false;

			usersDb.update({_id: users[fromId]._id}, { $set: { auth: false } }, function(err,newDocs){	
				console.log(newDocs);	
			});

			return {
				message: 'Авторизация отменена.',
				options: {
					parse_mode : 'Markdown',
					reply_markup: JSON.stringify({
						resize_keyboard: true,
						keyboard: [
								  [{ text: 'Новая заявка'}],
								  [{ text: 'Инструкция'}]          
								]
					})
				}
			};
		}

		if (users[fromId].auth){
			return {};
		} else {
			return {
				message: 'Для продолжения необходима авторизация.',
				type: 'common',
				options: {
					reply_markup: JSON.stringify({
					keyboard: [
						[{ text: 'Новая заявка'}],
						[{ text: 'Инструкция'}]          
					]
					})
				}
			};
		}

	}	  


	// Первый запуск (после сбоя и т.п.)
	
	// загрузить базу состояния
	let Datastore = require('nedb'),
		requestsDb = new Datastore({ filename: 'db/requests.db', autoload: true }),
		usersDb = new Datastore({ filename: 'db/users.db', autoload: true });
	
	requestsDb.find({}, function(err,data){
		requests = data;
	});
	
	usersDb.find({}, function(err,data){
		//users = data;
		for(let i=0;i<data.length; i++){
			users[data[i].id] = data[i];
		}
	});

	
    // Написать мне ... (/echo Hello World! - пришлет сообщение с этим приветствием.)
    bot.onText(/\/echo (.+) (.+)/, function (msg, match) {
      let fromId = msg.from.id;
      bot.sendMessage(fromId, '');
    });

	bot.on('photo',function (msg){
		let fromId = msg.from.id;
		if(sessions[fromId] !== undefined && sessions[fromId].endTime == undefined){
			bot.downloadFile(msg.photo[2].file_id, sessions[fromId].folderName)
				.then((filePath) => {
					sessions[fromId].files.push(filePath);
				});
			bot.sendMessage(fromId, 'файл принят', {
				parse_mode: 'Markdown',
				reply_markup: JSON.stringify({resize_keyboard: true})
			});

		} else {
			bot.sendMessage(fromId, 'нет открытой заявки', {
				parse_mode: 'Markdown',
				reply_markup: JSON.stringify({resize_keyboard: true})
			});
		}
		
	});



let appConfig = {
    "port": 4470    
};

const path            	= require('path');  // формирование пути в системе
const express         	= require('express');
const cors           	= require('cors');
const bodyParser      	= require("body-parser");
const app             	= express();
const http            	= require('http').Server(app);
const serveIndex 		= require('serve-index');

app.use( bodyParser.json({limit: '50mb'}) );
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit:50000
}));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")), serveIndex('public', {'icons': true}));


// подключение bodyParser
	// bodyParser with error check
	app.use((req, res, next) => {
		bodyParser.json({
			verify: addRawBody,
		})(req, res, (err) => {
			if (err) {
				console.log(err);
				res.sendStatus(400);
				return;
			}
			next();
		});
	});

	function addRawBody(req, res, buf, encoding) {
		req.rawBody = buf.toString();
	}

app.use(bodyParser.urlencoded({ extended: true }));

http.listen(appConfig.port, function(){
    console.log('ping started '+appConfig.port);
});


app.get('/test', function (req, res) {
	console.log(req);
	res.send('ok');
});
