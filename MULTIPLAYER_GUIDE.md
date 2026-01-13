# 🎮 Multiplayer Setup Guide

## Chức năng đã triển khai

✅ **Server Socket.IO** - Xử lý kết nối real-time
✅ **Đồng bộ vị trí** - Position & rotation của tất cả players
✅ **Đồng bộ weapon** - Hiển thị weapon của người chơi khác
✅ **Đồng bộ model** - Character model với kích thước chuẩn hóa
✅ **Team system** - 2 phe (Red vs Blue) tự động phân chia
✅ **Damage system** - Bắn nhau được, gây damage thật
✅ **Health system** - Health bar, damage feedback, respawn
✅ **Hit detection** - Phát hiện va chạm với remote players
✅ **Name tags & Health bars** - Hiển thị thông tin người chơi

## Hướng dẫn chạy

### Bước 1: Chạy Server
```bash
npm run server
```

Server sẽ chạy trên cổng 3000.

### Bước 2: Chạy Game Client (Terminal 1)
```bash
npm run dev
```

Mở browser tại `http://localhost:5173` (hoặc port mà Vite chỉ định)

### Bước 3: Mở browser thứ hai để test multiplayer
- Mở thêm 1 tab/browser khác
- Truy cập cùng URL: `http://localhost:5173`

### Hoặc chạy tất cả cùng lúc:
```bash
npm start
```

Lệnh này sẽ chạy cả server và client đồng thời.

## Test Multiplayer

1. **Mở 2 browser tabs/windows**
2. **Player 1** sẽ được gán vào **Team RED** 🔴
3. **Player 2** sẽ được gán vào **Team BLUE** 🔵
4. Di chuyển trong game:
   - Bạn sẽ thấy character model của người chơi khác
   - Weapon của họ cũng được hiển thị
   - Name tag và health bar phía trên đầu
5. Bắn nhau:
   - Bắn vào người chơi team khác để gây damage
   - Hitmarker sẽ xuất hiện khi trúng
   - Health bar giảm dần
   - Khi hết máu sẽ respawn sau 3 giây

## Các tính năng chính

### 🎯 Hit Detection
- Sử dụng sphere collision detection
- Radius ~0.6m cho mỗi player
- Gửi damage event qua Socket.IO

### ⚔️ Team-based Combat
- Chỉ có thể gây damage cho team đối phương
- Team được gán tự động (luân phiên Red/Blue)
- Visual indicator: màu sắc khác nhau

### 🎨 Visual Synchronization
- Character model được scale chuẩn hóa (1.8m height)
- Weapon được scale nhỏ gọn (0.4m size)
- Smooth interpolation cho movement
- Name tag và health bar luôn quay về phía camera

### 📡 Network Optimization
- Update rate: 30 updates/second
- Position interpolation để movement mượt mà
- Chỉ gửi dữ liệu cần thiết

## Troubleshooting

### Không thấy người chơi khác?
- Kiểm tra console log để xem có kết nối được server không
- Đảm bảo server đang chạy (`npm run server`)
- Kiểm tra network tab trong DevTools

### Model/Weapon quá lớn hoặc nhỏ?
- Code đã có auto-scaling dựa trên bounding box
- Character: 1.8m height standard
- Weapon: 0.4m size standard

### Bắn không gây damage?
- Kiểm tra console để xem hit detection
- Đảm bảo 2 players ở 2 team khác nhau
- Kiểm tra khoảng cách (phải < 0.6m để hit)

## Architecture

```
Client (Browser 1) ←→ Socket.IO Server ←→ Client (Browser 2)
       ↓                      ↓                      ↓
NetworkManager         Player State          NetworkManager
       ↓                   Storage                   ↓
RemotePlayerManager                      RemotePlayerManager
       ↓                                             ↓
   RemotePlayer(s)                              RemotePlayer(s)
```

## Files Created/Modified

### New Files:
- `server.js` - Node.js Socket.IO server
- `src/NetworkManager.js` - Network connection handler
- `src/RemotePlayerManager.js` - Remote player management
- `src/RemotePlayer.js` - Remote player rendering

### Modified Files:
- `package.json` - Added Socket.IO dependencies
- `src/main.js` - Integrated multiplayer system
- `src/shooting.js` - Added remote player hit detection

## Next Steps

Để mở rộng thêm:
- [ ] Add chat system
- [ ] Add scoreboard
- [ ] Add more teams
- [ ] Add spectator mode
- [ ] Add minimap
- [ ] Add player names input
- [ ] Add reconnection handling
- [ ] Add lag compensation
