const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB connection
const DB_PASSWORD = '878664'; // Thay thế bằng mật khẩu thực của bạn
const MONGODB_URI = `mongodb+srv://truongnura008:${DB_PASSWORD}@data.q5oifbv.mongodb.net/thientai`;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Kết nối MongoDB Atlas thành công'))
.catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Define Schemas
const taikhoanSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { collection: 'taikhoan' });

const thongtinSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    hoten: { type: String, required: true },
    diachi: { type: String, required: true },
    ngaysinh: { type: Date, required: true },
    email: { type: String, required: true },
    sdt: { type: String, required: true }
}, { collection: 'thongtin' });

const thientaiSchema = new mongoose.Schema({
    ID: { type: String, required: true, unique: true },
    diachi: { type: String, required: true },
    thoigian: { type: Date, required: true },
    mucdo: { type: String, required: true },
    loaithientai: { type: String, required: true }
}, { collection: 'thientai' });

const baocaoSchema = new mongoose.Schema({
    IDthientai: { type: String, required: true },
    thietmang: { type: Number, default: 0 },
    bithuong: { type: Number, default: 0 },
    trangthai: { type: String, required: true },
    linkbaocao: { type: String },
    thoigian: { type: Date, required: true }
}, { collection: 'baocao' });

// Define Models
const TaiKhoan = mongoose.model('TaiKhoan', taikhoanSchema);
const ThongTin = mongoose.model('ThongTin', thongtinSchema);
const ThienTai = mongoose.model('ThienTai', thientaiSchema, 'thientai');
const BaoCao = mongoose.model('BaoCao', baocaoSchema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// API Routes
// Get all disasters
app.get('/disasters', async (req, res) => {
    try {
        const disasters = await ThienTai.find().sort({ thoigian: -1 });
        res.json(disasters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new disaster
app.post('/disasters', async (req, res) => {
    try {
        // Tìm ID lớn nhất hiện tại
        const maxIdDoc = await ThienTai.findOne().sort({ ID: -1 });
        const nextId = maxIdDoc ? parseInt(maxIdDoc.ID) + 1 : 16;

        const thientai = new ThienTai({
            ID: nextId.toString(),
            diachi: req.body.diachi,
            thoigian: new Date(req.body.thoigian),
            mucdo: req.body.mucdo,
            loaithientai: req.body.loaithientai
        });

        await thientai.save();

        res.json({
            success: true,
            message: 'Thêm thiên tai thành công',
            data: thientai
        });
    } catch (error) {
        console.error('Lỗi khi thêm thiên tai:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi thêm thiên tai'
        });
    }
});

// API xóa thiên tai
app.delete('/disasters/:id', async (req, res) => {
    try {
        const thientai = await ThienTai.findOne({ ID: req.params.id });
        if (!thientai) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thiên tai'
            });
        }

        await thientai.deleteOne();

        res.json({
            success: true,
            message: 'Xóa thiên tai thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa thiên tai:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa thiên tai'
        });
    }
});

// API cập nhật thiên tai
app.put('/disasters/:id', async (req, res) => {
    try {
        const thientai = await ThienTai.findOne({ ID: req.params.id });
        if (!thientai) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thiên tai'
            });
        }

        // Cập nhật thông tin
        thientai.diachi = req.body.diachi;
        thientai.thoigian = new Date(req.body.thoigian);
        thientai.mucdo = req.body.mucdo;
        thientai.loaithientai = req.body.loaithientai;

        await thientai.save();

        res.json({
            success: true,
            message: 'Cập nhật thiên tai thành công',
            data: thientai
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thiên tai:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật thiên tai'
        });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Kiểm tra username có tồn tại không
        const user = await TaiKhoan.findOne({ username: username });
        
        if (!user) {
            // Username không tồn tại
            return res.json({ success: false, message: 'username_not_found' });
        }

        // Kiểm tra password
        if (user.password !== password) {
            // Mật khẩu không đúng
            return res.json({ success: false, message: 'wrong_password' });
        }

        // Đăng nhập thành công
        res.json({ success: true, message: 'login_success' });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// API để lấy báo cáo theo ID thiên tai
app.get('/reports/:thientaiId', async (req, res) => {
    try {
        const thientaiId = req.params.thientaiId;
        console.log('Đang tìm thiên tai với ID:', thientaiId);
        
        // Kiểm tra xem thiên tai có tồn tại không
        const disaster = await ThienTai.findOne({ ID: thientaiId });
        if (!disaster) {
            console.log('Không tìm thấy thiên tai với ID:', thientaiId);
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy thiên tai' 
            });
        }
        console.log('Đã tìm thấy thiên tai:', disaster);

        // Lấy các báo cáo có IDthientai trùng với ID của thiên tai
        console.log('Đang tìm báo cáo với IDthientai:', thientaiId);
        const reports = await BaoCao.find({ IDthientai: thientaiId })
            .sort({ thoigian: -1 });
        
        console.log('Số lượng báo cáo tìm thấy:', reports.length);
        
        res.json({
            success: true,
            data: {
                thientai: disaster,
                baocao: reports
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy báo cáo:', error);
        res.status(500).json({ 
            success: false,
            message: 'Có lỗi xảy ra khi lấy thông tin báo cáo' 
        });
    }
});

// API thêm báo cáo mới
app.post('/reports', async (req, res) => {
    try {
        // Kiểm tra xem thiên tai có tồn tại không
        const disaster = await ThienTai.findOne({ ID: req.body.IDthientai });
        if (!disaster) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thiên tai'
            });
        }

        const baocao = new BaoCao({
            IDthientai: req.body.IDthientai,
            thietmang: req.body.thietmang,
            bithuong: req.body.bithuong,
            trangthai: req.body.trangthai,
            linkbaocao: req.body.linkbaocao,
            thoigian: new Date()
        });

        await baocao.save();

        res.status(201).json({
            success: true,
            message: 'Thêm báo cáo thành công',
            data: baocao
        });
    } catch (error) {
        console.error('Lỗi khi thêm báo cáo:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi thêm báo cáo'
        });
    }
});

// Get disaster by ID
app.get('/disasters/:id', async (req, res) => {
    try {
        const disaster = await ThienTai.findOne({ ID: req.params.id });
        if (!disaster) {
            return res.status(404).json({ message: 'Không tìm thấy thiên tai' });
        }
        res.json(disaster);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API đăng ký tài khoản
app.post('/register', async (req, res) => {
    // Bắt đầu session cho transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Kiểm tra xem username đã tồn tại chưa
        const existingUser = await TaiKhoan.findOne({ username: req.body.username }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
        }

        // Kiểm tra xem email đã được sử dụng chưa
        const existingEmail = await ThongTin.findOne({ email: req.body.email }).session(session);
        if (existingEmail) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Email đã được sử dụng!' });
        }

        // Tạo tài khoản mới
        const taikhoan = new TaiKhoan({
            username: req.body.username,
            password: req.body.password
        });

        // Tạo thông tin người dùng mới
        const thongtin = new ThongTin({
            username: req.body.username,
            hoten: req.body.hoten,
            diachi: req.body.diachi,
            ngaysinh: new Date(req.body.ngaysinh),
            email: req.body.email,
            sdt: req.body.sdt
        });

        // Lưu cả hai document trong transaction
        await taikhoan.save({ session });
        await thongtin.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        // Nếu có lỗi, rollback transaction
        await session.abortTransaction();
        session.endSession();

        console.error('Lỗi khi đăng ký:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra khi đăng ký!' });
    }
});

// API đặt lại mật khẩu
app.post('/reset-password', async (req, res) => {
    console.log('Yêu cầu đặt lại mật khẩu:', req.body);
    
    const { email, phone } = req.body;
    
    try {
        // Tìm thông tin người dùng từ email
        const userInfo = await ThongTin.findOne({ email: email });
        
        if (!userInfo) {
            console.log('Không tìm thấy email:', email);
            return res.json({ success: false, message: 'Email không tồn tại trong hệ thống' });
        }
        
        // Kiểm tra số điện thoại
        if (userInfo.sdt !== phone) {
            console.log('Số điện thoại không khớp');
            return res.json({ success: false, message: 'Số điện thoại không khớp với tài khoản' });
        }
        
        // Tìm username từ thông tin người dùng
        const username = userInfo.username;
        
        // Tạo mật khẩu mới ngẫu nhiên - 8 chữ số
        const newPassword = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        // Cập nhật mật khẩu trong database
        await TaiKhoan.findOneAndUpdate(
            { username: username },
            { password: newPassword }
        );
        
        console.log('Đã đặt lại mật khẩu cho:', username, 'Mật khẩu mới:', newPassword);
        
        return res.json({ 
            success: true, 
            message: 'Mật khẩu đã được đặt lại thành công',
            newPassword: newPassword
        });
        
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu' 
        });
    }
});

// API lấy thông tin người dùng
app.get('/user-info/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const userInfo = await ThongTin.findOne({ username: username });
        
        if (!userInfo) {
            return res.json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
        }
        
        res.json({
            success: true,
            info: userInfo
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' 
        });
    }
});

// API đổi mật khẩu
app.post('/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        
        // Kiểm tra tài khoản
        const user = await TaiKhoan.findOne({ username: username });
        
        if (!user) {
            return res.json({ success: false, message: 'Không tìm thấy tài khoản' });
        }
        
        // Kiểm tra mật khẩu hiện tại
        if (user.password !== currentPassword) {
            return res.json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }
        
        // Cập nhật mật khẩu mới
        await TaiKhoan.findOneAndUpdate(
            { username: username },
            { password: newPassword }
        );
        
        res.json({ 
            success: true, 
            message: 'Đổi mật khẩu thành công' 
        });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi đổi mật khẩu' 
        });
    }
});

// API cập nhật báo cáo
app.put('/reports/:id', async (req, res) => {
    try {
        const baocao = await BaoCao.findById(req.params.id);
        if (!baocao) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        // Cập nhật thông tin
        baocao.thietmang = req.body.thietmang;
        baocao.bithuong = req.body.bithuong;
        baocao.trangthai = req.body.trangthai;
        baocao.linkbaocao = req.body.linkbaocao;

        await baocao.save();

        res.json({
            success: true,
            message: 'Cập nhật báo cáo thành công',
            data: baocao
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật báo cáo:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật báo cáo'
        });
    }
});

// API xóa báo cáo
app.delete('/reports/:id', async (req, res) => {
    try {
        const baocao = await BaoCao.findById(req.params.id);
        if (!baocao) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo'
            });
        }

        await baocao.deleteOne();

        res.json({
            success: true,
            message: 'Xóa báo cáo thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa báo cáo:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi xóa báo cáo'
        });
    }
});

// API lấy danh sách báo cáo theo ID thiên tai
app.get('/reports/disaster/:thientaiId', async (req, res) => {
    try {
        const reports = await BaoCao.find({ IDthientai: req.params.thientaiId });
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách báo cáo:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách báo cáo' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});

function handleReportClick(reportId, report) {
    if (window.isEditReportMode) {
        showEditReportModal(report);
        window.isEditReportMode = false;
    } else if (window.isDeleteReportMode) {
        showDeleteReportConfirm(reportId);
        window.isDeleteReportMode = false;
    }
}
