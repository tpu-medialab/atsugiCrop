# atsugiCrop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Maps API](https://img.shields.io/badge/API-Google%20Maps-red)](https://developers.google.com/maps)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

`atsugiCrop` は、国土交通省の3D都市モデル「Project PLATEAU」から提供されている厚木市のデータを対象に、データ抽出と指定した町村単位のデータを取得できるアプリケーションです。

## 機能

### 1. データ抽出 (`city.py`)
PLATEAUのデータを解析し、Webアプリケーションで利用可能な軽量データへと変換します。

### 2. 町村単位のデータ取得 (`app.js`)
ブラウザ上で町村単位のデータをダウンロードできる環境を提供します。
- Google Maps JavaScript APIを用いた可視化
- 必要なエリアのデータの取得

## インストール方法

### 推奨環境
- **Node.js**: v18.x
- **Python**: 3.10　以上
- **Google Maps JavaScript API Key**

プロジェクトルートに `.env` ファイルを作成し、取得したGoogle Maps APIキーを設定してください。

```bash
git clone https://github.com/tpu-medialab/atsugiCrop.git
cd atsugiCrop

# .env ファイルの作成
echo "GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE" > .env

#必要なpythonモジュールをインストールする
pip install -r requirements.txt

#error: externally-managed-environmentが出る場合は以下を実行
pip install -r requirements.txt --break-system-packages

#データの前処理: city.py を実行し、CityGMLから必要な情報を抽出・変換して準備します。
#必要性：厚木市からダウンロードしたデータファイルはひとまとまりになっているので、町ごとに分割する必要があります。
#将来、分割されたものが配布される場合、このプロセスは不要です。
python3 city_to_town.py

#サーバーの起動:
npm run serve
```
ブラウザでの確認: http://localhost:3000 にアクセスし、3Dデータの可視化を確認します。


## 貢献
バグ報告、機能改善の提案、プルリクエストを歓迎します。

## ライセンス
本プロジェクトは MIT License の下で公開されています。

## 問い合わせ
東京工芸大学 工学部 映像メディア研究室
https://www.mega.t-kougei.ac.jp/media/

森山剛
- E-mail: moriyama@t-kougei.ac.jp
- Facebook：https://www.facebook.com/tsuyoshi.moriyama
- Instagram: https://www.instagram.com/tsuyoshi.moriyama

##
@misc{atsugiCrop2026,
  title     = {atsugiCrop},
  author    = {Koya Arashiro and Yuki Hitomi,Tsuyoshi Moriyama},
  year      = {2026},
  url       = {https://github.com/tpu-medialab/atsugiCrop/}
}
