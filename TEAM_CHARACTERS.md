# 🎮 TEAM-BASED CHARACTERS

## ✅ Đã cập nhật

### Phân công nhân vật theo đội:

**🔵 Team BLUE → MESSI**
- Model: `messi_character.glb`
- Màu team: Xanh dương
- Player đầu tiên, thứ 3, thứ 5... → Team Blue

**🔴 Team RED → RONALDO**  
- Model: `ronaldo_character.glb`
- Màu team: Đỏ
- Player thứ 2, thứ 4, thứ 6... → Team Red

## 🔧 Files đã cập nhật:

### 1. `server.js`
```javascript
// Assign character based on team
const characterName = team === 'blue' ? 'messi_character' : 'ronaldo_character';
```

Server tự động gán character name khi player kết nối dựa trên team.

### 2. `src/RemotePlayer.js`
```javascript
// Constructor - fallback to team-based character
this.characterName = data.characterName || 
    (data.team === 'blue' ? 'messi_character' : 'ronaldo_character');

// loadCharacterModel - dynamic loading
const modelPath = `/models/${this.characterName}.glb`;
```

Remote player load model dựa trên characterName nhận từ server.

### 3. Name Tags
Name tag hiển thị:
- `[BLUE] MESSI` cho đội xanh
- `[RED] RONALDO` cho đội đỏ

## 📝 Cách test:

1. **Browser 1** - Team Blue
   - Mở `http://localhost:5173/Final-3D-Programming/`
   - Sẽ thấy notification: "YOU ARE TEAM BLUE"
   - Character của bạn: Messi (local player)
   
2. **Browser 2** - Team Red
   - Mở tab/window thứ 2
   - Sẽ thấy notification: "YOU ARE TEAM RED"  
   - Character của bạn: Ronaldo (local player)

3. **Trong game:**
   - Browser 1 thấy remote player với name tag `[RED] RONALDO`
   - Browser 2 thấy remote player với name tag `[BLUE] MESSI`
   - Cả 2 đều có model và weapon đúng kích thước

## 🎨 Visual Features:

- ✅ Team color tint trên model (subtle red/blue)
- ✅ Name tag với background team color
- ✅ Character name hiển thị rõ ràng
- ✅ Placeholder capsule với team color khi model chưa load

## 🚀 Restart Server

Server cần restart để áp dụng thay đổi:

```bash
# Stop server hiện tại (Ctrl+C)
# Restart server
npm run server
```

Client (Vite) tự động hot reload, không cần restart!

## ✨ Kết quả

Giờ đây:
- 🔵 **Messi** đại diện cho Team Blue
- 🔴 **Ronaldo** đại diện cho Team Red
- Rõ ràng, dễ phân biệt
- Cạnh tranh kinh điển! ⚽🏆
