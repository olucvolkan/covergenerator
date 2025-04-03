#!/bin/bash

# Renklendirme için
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Script adı
APP_NAME="covergen-wild-mountain-3122"
ENV_FILE=".env"

echo -e "${YELLOW}Stripe çevre değişkenleri Fly.io'ya yüklenecek...${NC}"

# .env dosyasının mevcut olup olmadığını kontrol et
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Hata: $ENV_FILE dosyası bulunamadı. Script ana dizinde çalıştırılmalı.${NC}"
  exit 1
fi

# Kullanıcı onayı al
echo -e "${YELLOW}Bu script $ENV_FILE içindeki Stripe değişkenlerini $APP_NAME Fly.io uygulamasına yükleyecek.${NC}"
read -p "Devam etmek istiyor musunuz? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo -e "${YELLOW}İşlem iptal edildi.${NC}"
  exit 0
fi

# .env dosyasından Stripe ile ilgili değişkenleri oku
CMD="fly secrets set -a $APP_NAME"
FOUND_KEYS=0

while IFS= read -r line; do
  # Sadece Stripe ile ilgili değişkenleri al
  if [[ "$line" == *"STRIPE"* && "$line" == *"="* && ! "$line" =~ ^[[:space:]]*# ]]; then
    KEY=$(echo "$line" | cut -d '=' -f 1)
    VALUE=$(echo "$line" | cut -d '=' -f 2-)
    CMD="$CMD $KEY=\"$VALUE\""
    ((FOUND_KEYS++))
  fi
done < "$ENV_FILE"

if [ $FOUND_KEYS -eq 0 ]; then
  echo -e "${RED}Uyarı: .env dosyasında Stripe ile ilgili değişken bulunamadı.${NC}"
  exit 1
fi

# Komutu çalıştır
echo -e "${YELLOW}$FOUND_KEYS adet Stripe değişkeni Fly.io'ya yükleniyor...${NC}"
echo -e "${GREEN}Çalıştırılacak komut: $CMD${NC}"

# Güvenlik için tekrar onay al
read -p "Komutu çalıştırmak istiyor musunuz? (y/N): " EXEC_CONFIRM
if [[ "$EXEC_CONFIRM" != "y" && "$EXEC_CONFIRM" != "Y" ]]; then
  echo -e "${YELLOW}İşlem iptal edildi.${NC}"
  exit 0
fi

# Komutu değerlendirip çalıştır
eval $CMD

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Stripe çevre değişkenleri başarıyla güncellendi!${NC}"
else
  echo -e "${RED}Stripe çevre değişkenleri güncellenirken bir hata oluştu.${NC}"
  exit 1
fi

echo -e "${YELLOW}İşlem tamamlandı.${NC}" 