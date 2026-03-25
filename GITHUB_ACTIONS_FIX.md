# GitHub Actions SSH Key Fix

## Проблема
GitHub Actions падает на шаге "Setup SSH" из-за отсутствия SSH ключа.

## Выполнено
✅ Сгенерирован новый SSH ключ пара (ed25519)
✅ Публичный ключ добавлен на сервер 46.149.68.9 в `~/.ssh/authorized_keys`

## Что нужно сделать вручную

### 1. Обновить секрет SSH_PRIVATE_KEY в GitHub

Перейти: https://github.com/dkyitdevops/ai-team-office/settings/secrets/actions

Найти секрет `SSH_PRIVATE_KEY` и обновить его значение на:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fwAAAJiunSz1rp0s
9QAAAAtzc2gtZWQyNTUxOQAAACCfIS6F/xb5wTcIwPfpm6uSNitcDnxIiRmNyxLp/pQ4fw
AAAEDnkp+EuhL1JDWzxcnS2CmQ68UA9Ozg0zcQT6Va1muLvJ8hLoX/FvnBNwjA9+mbq5I2
K1wOfEiJGY3LEun+lDh/AAAADmdpdGh1Yi1hY3Rpb25zAQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
```

### 2. Проверить другие секреты

Убедитесь что установлены:
- `SERVER_HOST` = 46.149.68.9
- `SERVER_USER` = root
- `SSH_KNOWN_HOSTS` = (fingerprint сервера)

Получить fingerprint:
```bash
ssh-keyscan -t ed25519 46.149.68.9
```

Значение для `SSH_KNOWN_HOSTS`:
```
46.149.68.9 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHI7rckZqHLxZMxEHLMV0iHo2izLxmQr3nZo6d7sXA9J
```

### 3. Перезапустить workflow

После обновления секрета перейти:
https://github.com/dkyitdevops/ai-team-office/actions

Найти последний failed run и нажать "Re-run jobs" → "Re-run all jobs"

## Публичный ключ (уже на сервере)
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8hLoX/FvnBNwjA9+mbq5I2K1wOfEiJGY3LEun+lDh/ github-actions
```

## После успешного деплоя
- Закрыть Issue #25
- Перезапустить деплой для Issue #24
