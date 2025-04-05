function redirectToLogin() {
    window.location.href = "login.html"; // Điều hướng sang giao diện đăng nhập
}function redirectToRegister() {
    window.location.href = "register.html"; // Điều hướng sang giao diện đăng nhập
}

function showMessage(message, type) {
    const messageElement = document.getElementById('loginMessage');
    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
    messageElement.innerHTML = `${icon} ${message}`;
    messageElement.className = ''; // Xóa tất cả các class cũ
    messageElement.classList.add(type);
    messageElement.classList.add('show');
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

// Thêm hàm hiển thị modal
function showErrorModal(title, message) {
    const modal = document.getElementById('errorModal');
    const modalTitle = modal.querySelector('h3');
    const errorMessage = document.getElementById('errorMessage');
    
    modalTitle.textContent = title;
    errorMessage.textContent = message;
    modal.classList.add('show');

    // Tự động đóng modal sau 2 giây
    setTimeout(() => {
        modal.classList.remove('show');
    }, 1000);
}

// Thêm hàm hiển thị modal thành công
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('show');
    
    // Tự động đóng modal thành công và chuyển hướng sau 1.5 giây
    setTimeout(() => {
        modal.classList.remove('show');
        window.location.href = 'index.html';
    }, 1000);
}

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Kiểm tra thông tin đăng nhập
    if (!username || !password) {
        showErrorModal("Đăng nhập thất bại", "Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Lưu thông tin đăng nhập vào localStorage
            localStorage.setItem('loggedin', 'true');
            localStorage.setItem('username', username);
            
            // Hiển thị modal thành công
            showSuccessModal();
        } else {
            // Xử lý các loại lỗi khác nhau
            switch (data.message) {
                case 'username_not_found':
                    showErrorModal("Đăng nhập thất bại", "Username này không tồn tại trong hệ thống");
                    break;
                case 'wrong_password':
                    showErrorModal("Đăng nhập thất bại", "Mật khẩu không đúng");
                    break;
                default:
                    showErrorModal("Đăng nhập thất bại", "Có lỗi xảy ra, vui lòng thử lại!");
            }
        }
    } catch (error) {
        showErrorModal("Đăng nhập thất bại", "Có lỗi xảy ra, vui lòng thử lại!");
    }
});

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const icon = this;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text'; // Hiển thị mật khẩu
        icon.classList.remove('fa-eye-slash'); // Xóa icon "mắt đóng"
        icon.classList.add('fa-eye'); // Đổi sang icon "mắt mở" // Đổi sang icon "mắt đóng"
    } else {
        passwordInput.type = 'password'; // Ẩn mật khẩu
        icon.classList.remove('fa-eye'); // Xóa icon "mắt mở"
        icon.classList.add('fa-eye-slash');
    }
});


function hideAuthButtons() {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'none'; // Ẩn toàn bộ div
    } else {
        console.error("Không tìm thấy phần tử '.auth-buttons'");
    }
}

// Gọi hàm khi đăng nhập thành công
if (localStorage.getItem('loggedin')) {
    hideAuthButtons(); // Ẩn các nút khi trạng thái đăng nhập đã lưu
}

function checkLoginState() {
    const isLoggedIn = localStorage.getItem('loggedin');
    const username = localStorage.getItem('username');
    const authButtons = document.querySelector('.auth-buttons');
    const welcomeContainer = document.querySelector('.welcome-container');
    const actionButtons = document.getElementById('actionButtons');
    const usernameDisplay = document.getElementById('usernameDisplay');

    if (isLoggedIn === 'true' && username) {
        // Ẩn nút đăng nhập/đăng ký
        authButtons.style.display = 'none';
        // Hiển thị welcome message và nút đăng xuất
        welcomeContainer.style.display = 'flex';
        usernameDisplay.textContent = username;
        // Hiển thị các nút action
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }
    } else {
        // Hiển thị nút đăng nhập/đăng ký
        authButtons.style.display = 'flex';
        // Ẩn welcome message và nút đăng xuất
        welcomeContainer.style.display = 'none';
        // Ẩn các nút action
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }
}

function logout() {
    // Xóa thông tin đăng nhập khỏi localStorage
    localStorage.removeItem('loggedin');
    localStorage.removeItem('username');
    
    // Cập nhật giao diện
    checkLoginState();
}

// Kiểm tra trạng thái đăng nhập khi trang được tải
window.onload = function() {
    checkLoginState();
};

