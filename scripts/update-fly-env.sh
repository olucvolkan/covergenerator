#!/bin/bash

# Renklendirme için
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Script adı
APP_NAME="covergen-wild-mountain-3122"
ENV_FILE=".env"

echo -e "${YELLOW}Fly.io ortam değişkenleri güncelleme başlatılıyor...${NC}"

# .env dosyasının mevcut olup olmadığını kontrol et
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Hata: $ENV_FILE dosyası bulunamadı. Script ana dizinde çalıştırılmalı.${NC}"
  exit 1
fi

# Kullanıcı onayı al
echo -e "${YELLOW}Bu script $ENV_FILE içindeki değerleri $APP_NAME Fly.io uygulamasına yükleyecek.${NC}"
read -p "Devam etmek istiyor musunuz? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo -e "${YELLOW}İşlem iptal edildi.${NC}"
  exit 0
fi

# .env dosyasından değişkenleri oku ve fly secrets set komutunu oluştur
CMD="fly secrets set -a $APP_NAME"

while IFS= read -r line; do
  # Boş satırları ve yorum satırlarını atla
  if [[ ! "$line" =~ ^[[:space:]]*$ && ! "$line" =~ ^[[:space:]]*# ]]; then
    # = içeren satırları al
    if [[ "$line" == *"="* ]]; then
      # Çift tırnak ekle
      KEY=$(echo "$line" | cut -d '=' -f 1)
      VALUE=$(echo "$line" | cut -d '=' -f 2-)
      CMD="$CMD $KEY=\"$VALUE\""
    fi
  fi
done < "$ENV_FILE"

# Komutu çalıştır
echo -e "${YELLOW}Çevre değişkenleri Fly.io'ya yükleniyor...${NC}"
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
  echo -e "${GREEN}Çevre değişkenleri başarıyla güncellendi!${NC}"
else
  echo -e "${RED}Çevre değişkenleri güncellenirken bir hata oluştu.${NC}"
  exit 1
fi

echo -e "${YELLOW}İşlem tamamlandı.${NC}" 