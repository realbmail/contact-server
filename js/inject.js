// js/inject.js
(function () {
    // 设置 bmail 对象
    window.bmail = {
        version: '1.0.0',
        connect: function () {
            console.log('Connecting...');
        },
    };
    console.log('BMail injected');
})();
