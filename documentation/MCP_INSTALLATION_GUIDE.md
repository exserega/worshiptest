# 📦 Руководство по установке MCP серверов для Agape Worship

## 🔧 Установка Firebase MCP Server (ОБЯЗАТЕЛЬНО!)

### 1. Авторизация в Firebase CLI
Сначала нужно авторизоваться в Firebase:
```bash
npx -y firebase-tools@latest login --reauth
```

### 2. Добавление в Cursor
1. Откройте Cursor
2. Нажмите `Ctrl + ,` (или `Cmd + ,` на Mac)
3. Перейдите в **Features** → **MCP**
4. Нажмите **"+ Add new global MCP server"**
5. Откроется файл `~/.cursor/mcp.json`

### 3. Вставьте конфигурацию
Добавьте в файл `mcp.json`:
```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": [
        "-y", 
        "firebase-tools@latest", 
        "experimental:mcp",
        "--dir",
        "/workspace"
      ]
    }
  }
}
```

**Важно**: Замените `/workspace` на полный путь к вашему проекту!

### 4. Сохраните и перезапустите Cursor
- Сохраните файл: `Ctrl + S`
- Полностью закройте Cursor
- Откройте Cursor снова

### 5. Проверка работы
В Cursor напишите в чате:
```
Покажи информацию о текущем Firebase проекте
```

Если все работает, вы увидите информацию о вашем проекте.

## 📂 Установка File System MCP

Добавьте в тот же `mcp.json`:
```json
{
  "mcpServers": {
    "firebase": {
      // ... конфигурация выше ...
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem"
      ]
    }
  }
}
```

## 🐙 Установка GitHub MCP

### 1. Создайте Personal Access Token
1. Откройте https://github.com/settings/tokens
2. Нажмите "Generate new token (classic)"
3. Выберите права:
   - ✅ repo (полный доступ)
   - ✅ workflow
   - ✅ read:org
4. Скопируйте токен

### 2. Добавьте в mcp.json
```json
{
  "mcpServers": {
    "firebase": {
      // ... конфигурация выше ...
    },
    "filesystem": {
      // ... конфигурация выше ...
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_ВАШ_ТОКЕН_ЗДЕСЬ"
      }
    }
  }
}
```

## 🔍 Полный пример mcp.json

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": [
        "-y", 
        "firebase-tools@latest", 
        "experimental:mcp",
        "--dir",
        "C:/Users/YourName/projects/worshiptest"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_1234567890abcdef"
      }
    }
  }
}
```

## 🚨 Частые проблемы и решения

### Проблема: "Firebase не инициализирован"
**Решение**: Убедитесь, что вы авторизованы:
```bash
firebase login
firebase projects:list
```

### Проблема: "MCP server not found"
**Решение**: 
1. Проверьте путь к проекту в `--dir`
2. Убедитесь, что в проекте есть `firebase.json`
3. Перезапустите Cursor полностью

### Проблема: "GitHub token invalid"
**Решение**: Создайте новый токен с правильными правами

## 📝 Проверка установки

После установки всех серверов, проверьте их работу:

### Firebase MCP:
```
Список всех пользователей в Firebase Auth
```

### File System:
```
Покажи структуру папки src
```

### GitHub:
```
Покажи последние 5 коммитов
```

## 💡 Советы по использованию

1. **Firebase MCP автоматически определяет функции** вашего проекта по `firebase.json`
2. **Можно ограничить функции** добавив `--only`:
   ```json
   "args": [
     "-y", 
     "firebase-tools@latest", 
     "experimental:mcp",
     "--only", 
     "auth,firestore"
   ]
   ```
3. **Для отладки** можно включить логи:
   ```json
   "env": {
     "DEBUG": "mcp:*"
   }
   ```

## 🎯 Что дальше?

1. Попробуйте команды из раздела "Проверка установки"
2. Изучите возможности каждого сервера
3. Интегрируйте в свой рабочий процесс

Успешной разработки! 🚀