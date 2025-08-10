#!/bin/bash

# Скрипт для деплоя приложения "Клуб молосольных огурчиков🥒"

echo "🥒 Деплой Клуба молосольных огурчиков..."
echo "===================================="

# Проверка наличия git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен. Пожалуйста, установите git."
    exit 1
fi

# Проверка наличия node и npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm."
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Создание билда
echo "🔨 Создание билда..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при создании билда"
    exit 1
fi

echo "✅ Билд успешно создан"

# Проверка наличия Vercel CLI
if command -v vercel &> /dev/null; then
    echo "🚀 Найден Vercel CLI, пробуем задеплоить..."
    
    # Попытка деплоя
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        echo "✅ Успешно задеплоено на Vercel!"
        echo "🌐 Проверьте вашу ссылку в консоли выше"
    else
        echo "⚠️ Не удалось задеплоить через Vercel CLI"
        echo "💡 Попробуйте вручную: https://vercel.com"
    fi
else
    echo "⚠️ Vercel CLI не найден"
    echo "💡 Установите Vercel CLI: npm i -g vercel"
    echo "💡 Или задеплойте вручную: https://vercel.com"
fi

echo ""
echo "📋 Инструкции для ручного деплоя:"
echo "1. Загрузите код на GitHub"
echo "2. Зайдите на https://vercel.com"
echo "3. Нажмите 'New Project'"
echo "4. Выберите ваш репозиторий"
echo "5. Нажмите 'Deploy'"
echo ""
echo "🔑 Админ-пароль: cucumber"
echo "🎮 Удачи в игре!"