# OMS Server - Оркестратор микросервисов

Серверная часть приложения "Оркестратор микросервисов" для управления Docker контейнерами через веб-интерфейс.

## Архитектура

- **NestJS** - основной фреймворк
- **TypeScript** - язык программирования
- **Runner Engine** - выполнение системных команд через SSE
- **Docker** - управление контейнерами
- **Git** - работа с репозиториями

## Основные функции

### Микросервисы
- `GET /api/microservices` - получение списка всех микросервисов
- `POST /api/microservices` - создание нового микросервиса
- `DELETE /api/microservices/:id` - удаление микросервиса
- `POST /api/microservices/:id/deploy` - деплой микросервиса
- `POST /api/microservices/:id/stop` - остановка микросервиса

### Репозитории (Wizard)
- `POST /api/repository/validate` - проверка доступности репозитория
- `POST /api/repository/branches` - получение списка веток
- `POST /api/repository/analyze` - анализ выбранной ветки

### Логи
- `GET /api/logs` - получение системных логов
- `DELETE /api/logs` - очистка логов

## Установка и запуск

### Предварительные требования

1. **Node.js** версии 18+
2. **Docker** установленный и запущенный
3. **Git** для работы с репозиториями
4. **Runner Engine** запущенный на порту 8989

### Установка зависимостей

```bash
npm install
```

### Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте переменные:

```env
# Порт приложения
PORT=3000

# URL Runner Engine
RUNNER_ENGINE_URL=http://localhost:8989

# Глобальная директория для микросервисов
DATA_DIR=/oms-catalog

# Путь к конфигурации Nginx
NGINX_CONFIG_PATH=/etc/nginx/nginx.conf

# WebSocket для real-time логов
WEBSOCKET_PORT=3001

# Настройки логирования
LOG_LEVEL=info
LOG_FILE=./data/logs/system.log
```

### Сборка и запуск

```bash
# Сборка проекта
npm run build

# Запуск в режиме разработки
npm run start:dev

# Запуск в продакшене
npm run start:prod
```

## Структура проекта

```
server/
├── src/
│   ├── config/                 # Конфигурация
│   ├── modules/               # Модули приложения
│   │   ├── microservices/     # Управление микросервисами
│   │   ├── repository/        # Работа с репозиториями
│   │   └── logs/              # Системные логи
│   ├── services/              # Бизнес-логика
│   │   ├── runner.service.ts  # Взаимодействие с Runner
│   │   ├── docker.service.ts  # Команды Docker
│   │   ├── git.service.ts     # Команды Git
│   │   └── filesystem.service.ts # Работа с файлами
│   ├── types/                 # TypeScript типы
│   └── utils/                 # Утилиты
├── data/                      # Данные приложения
└── templates/                 # Шаблоны конфигураций
```

## Особенности реализации

### Единая стратегия именования
- Имя микросервиса = имя директории = имя Docker проекта
- Все идентификаторы используют одну строку

### Источник правды
- **Docker** - статус контейнеров и метаданные
- **Git** - информация о репозиториях и коммитах
- **Файловая система** - код и конфигурации

### Логирование
- Все команды логируются в UI с маркировкой источника
- Поддержка real-time логов через WebSocket
- Детальная обработка ошибок с рекомендациями

### Wizard UX
- Пошаговое создание микросервисов
- Валидация на каждом этапе
- Анализ репозиториев и веток

## API Endpoints

### Микросервисы

#### Получить все микросервисы
```http
GET /api/microservices
```

#### Создать микросервис
```http
POST /api/microservices
Content-Type: application/json

{
  "name": "auth-service",
  "repository": "https://github.com/company/auth-service",
  "branch": "main",
  "environmentVariables": {
    "DB_HOST": "localhost",
    "DB_PORT": "5432"
  }
}
```

#### Деплой микросервиса
```http
POST /api/microservices/auth-service/deploy
```

#### Остановка микросервиса
```http
POST /api/microservices/auth-service/stop
```

#### Удаление микросервиса
```http
DELETE /api/microservices/auth-service
```

### Репозитории

#### Валидация репозитория
```http
POST /api/repository/validate
Content-Type: application/json

{
  "repository": "https://github.com/company/repo"
}
```

#### Получение веток
```http
POST /api/repository/branches
Content-Type: application/json

{
  "repository": "https://github.com/company/repo"
}
```

#### Анализ ветки
```http
POST /api/repository/analyze
Content-Type: application/json

{
  "repository": "https://github.com/company/repo",
  "branch": "main"
}
```

### Логи

#### Получить логи
```http
GET /api/logs?serviceId=auth-service
```

#### Очистить логи
```http
DELETE /api/logs
```

## Разработка

### Команды разработки

```bash
# Запуск в режиме разработки с hot reload
npm run start:dev

# Запуск с отладкой
npm run start:debug

# Линтинг кода
npm run lint

# Форматирование кода
npm run format

# Тестирование
npm run test
```

### Структура логов

```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  serviceId?: string | null;
  command?: string;
  source: "git" | "docker" | "nginx" | "system";
}
```

## Лицензия

MIT
