# telefile
telegram img reciever
в боте, создаёт зявку, позволяет отправить в бота фото. полученные фото выкладывает и присылает в почту.

config.json:
{	
    "passwords" : [""], пароли для входа
    "mailto"    : [""], адреса на которые придёт письмо с файлами
    "botToken"  : "", токен бота
    "serverAddr": "" публичный адрес сервера
}

mailConfig.json
{
    "host": "smtp.yandex.ru",
    "port": 465,
    "secure": true,
    "auth": {
        "user": "",
        "pass": ""
    }
}
