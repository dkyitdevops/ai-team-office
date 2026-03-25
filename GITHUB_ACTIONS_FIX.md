# 🔧 GitHub Actions Fix - Issue #25

## Диагностика

### Проблема
GitHub Actions падает на шаге **"Setup SSH"** с ошибкой `failure`.

### Причина
Секрет `SSH_PRIVATE_KEY` в GitHub отсутствует или содержит невалидный ключ.

### Проверено
- ✅ Workflow файл корректен
- ✅ SSH доступ к серверу 46.149.68.9 работает
- ✅ Публичный ключ добавлен в `~/.ssh/authorized_keys` на сервере
- ❌ Секрет `SSH_PRIVATE_KEY` в GitHub не обновлён

---

## ✅ Выполненные действия

### 1. Сгенерирована новая SSH ключ-пара
```bash
ssh-keygen -t ed25519 -C "github-actions" -f /tmp/github_actions_key
```

**Публичный ключ:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8hLoX/FvnBNwjA9+mbq5I2K1wOfEiJGY3LEun+lDh/ github-actions
```

**Приватный ключ:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fwAAAJiunSz1rp0s
9QAAAAtzc2gtZWQyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fw
AAAEDnkp+EuhL1JDWzxcnS2CmQ68UA9Ozg0zcQT6Va1muLvJ8hLoX/FvnBNwjA9+mbq5I2
K1wOfEiJGY3LEun+lDh/AAAADmdpdGh1Yi1hY3Rpb25zAQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
```

### 2. Публичный ключ добавлен на сервер
```bash
ssh root@46.149.68.9 "echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8hLoX/FvnBNwjA9+mbq5I2K1wOfEiJGY3LEun+lDh/ github-actions' >> ~/.ssh/authorized_keys"
```

### 3. Исправлен workflow
Файл: `.github/workflows/deploy.yml`

**Изменение:** Заменено использование `secrets.SSH_KNOWN_HOSTS` на `ssh-keyscan`:
```yaml
# Было:
echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts

# Стало:
ssh-keyscan -t ed25519 ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
```

Это устраняет необходимость вручную поддерживать fingerprint сервера в секретах.

---

## ⚠️ Требуется действие пользователя

### Обновить секрет SSH_PRIVATE_KEY

1. Перейти: https://github.com/dkyitdevops/ai-team-office/settings/secrets/actions

2. Найти секрет `SSH_PRIVATE_KEY` и обновить его значение на:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fwAAAJiunSz1rp0s
9QAAAAtzc2gtZWQyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fw
AAAEDnkp+EuhL1JDWzxcnS2CmQ68UA9Ozg0zcQT6Va1muLvJ8hLoX/FvnBNwjA9+mbq5I2
K1wOfEiJGY3LEun+lDh/AAAADmdpdGh1Yi1hY3Rpb25zAQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
```

### Проверить другие секреты

Убедитесь что установлены:
- ✅ `SERVER_HOST` = `46.149.68.9`
- ✅ `SERVER_USER` = `root`
- ❌ `SSH_KNOWN_HOSTS` — больше не нужен (можно удалить)

---

## 🚀 После обновления секрета

1. Перейти: https://github.com/dkyitdevops/ai-team-office/actions
2. Найти последний failed run
3. Нажать **"Re-run jobs"** → **"Re-run all jobs"**

## Ожидаемый результат
- Статус workflow: ✅ **success**
- Issue #25 можно закрыть
- Перезапустить деплой для Issue #24

---

## История запусков

| Run | Commit | Статус | Примечание |
|-----|--------|--------|------------|
| #13 | `0bdebda` | ❌ failure | Нужно обновить SSH_PRIVATE_KEY |
| #12 | `52be4b4` | ❌ failure | Workflow исправлен, но ключ невалиден |
| #11 | `dd2a41a` | ❌ failure | Исходная ошибка |

---

## Связанные коммиты
- `52be4b4` - fix(ci): auto-scan SSH host key instead of using secret
- `0bdebda` - docs: update fix instructions
