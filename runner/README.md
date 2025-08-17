# Host-based Deployment

Этот проект поддерживает host-based deployment для локальной разработки и тестирования.

## Требования

Перед запуском убедитесь, что у вас установлен:

**Node.js** 
- Скачать с [https://nodejs.org/](https://nodejs.org/)
- Убедитесь, что `node` и `npm` доступны в PATH

## Запуск приложения

### Автоматический запуск

1. Дважды кликните на файл `start.bat` в корне проекта
2. Скрипт автоматически:
   - Проверит наличие Node.js
   - Установит npm пакеты для engine и showcase
   - Запустит engine на порту 8989
   - Запустит showcase сервер на порту 8988

### Ручной запуск

Если вы предпочитаете запускать компоненты вручную:

#### Engine
```bash
cd engine
npm install
npm start
```

#### Showcase
```bash
cd showcase
npm install
npm start
```

## Структура deployment

```
oms-runner/
├── start.bat              # Скрипт запуска
├── engine/                # Engine приложение (NestJS)
│   └── dist/              # Собранный engine
└── showcase/              # Showcase приложение (React + Vite)
    └── dist/              # Собранный showcase (обслуживается npx serve)
```

## Порты

Порты для engine и showcase настраиваются в файле `start.bat`:

```batch
set ENGINE_PORT=8989
set SHOWCASE_PORT=8988
```

По умолчанию:
- **Engine**: http://localhost:8989
- **Showcase**: http://localhost:8988 (через npx serve)

### Изменение портов
1. Откройте файл `start.bat` в текстовом редакторе
2. Найдите строки с `ENGINE_PORT` и `SHOWCASE_PORT`
3. Измените значения на нужные порты
4. Сохраните файл

После изменения портов запустите `start.bat` - скрипт автоматически создаст/обновит `.env` файлы в папках `engine` и `showcase` с новыми значениями портов.
