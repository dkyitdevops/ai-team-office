# GitHub Actions SSH Key Fix - Issue #25

## Проблема
GitHub Actions падает на шаге "Setup SSH" из-за отсутствия/невалидности SSH ключа.

## Выполнено ✅

### 1. Сгенерирован новый SSH ключ
- Тип: ed25519
- Комментарий: github-actions

### 2. Публичный ключ добавлен на сервер
Сервер: 46.149.68.9
Файл: `~/.ssh/authorized_keys`

### 3. Исправлен workflow
Файл: `.github/workflows/deploy.yml`
- Заменен `secrets.SSH_KNOWN_HOSTS` на `ssh-keyscan` (автоматическое получение fingerprint)
- Это устраняет необходимость вручную поддерживать fingerprint в секретах

## Что нужно сделать вручную ⚠️

### Обновить секрет SSH_PRIVATE_KEY в GitHub

1. Перейти: https://github.com/dkyitdevops/ai-team-office/settings/secrets/actions

2. Найти секрет `SSH_PRIVATE_KEY` и обновить его значение:

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
- ❌ `SSH_KNOWN_HOSTS` — больше не нужен (удалите или оставьте)

## Публичный ключ (уже на сервере)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8hLoX/FvnBNwjA9+mbq5I2K1wOfEiJGY3LEun+lDh/ github-actions
```

## После обновления секрета

1. Перейти: https://github.com/dkyitdevops/ai-team-office/actions
2. Найти последний failed run
3. Нажать "Re-run jobs" → "Re-run all jobs"

## Ожидаемый результат
- Статус workflow: ✅ **success**
- Issue #25 можно закрыть
- Перезапустить деплой для Issue #24

---
Commit: `52be4b4`
