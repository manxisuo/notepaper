
var stamp;

$(function() {
    loadNotes();
    
    addExportListener();
});

function addExportListener() {
    $('#export').on('click', function() {
        /*
        if ($(this).text() == '备份数据') {
            $(this).text('关闭')
            exportNotes();
        }
        else {
            $(this).text('备份数据');
            $('#output').hide();
        } */
        exportNotes();
    });
}

function bindActions(note) {
    
    // 可改变位置
    note.draggable({
        cancel: '.not-draggable',
        handle: '.note-draggable',
        distance: 10,
        stop: function(event, ui) {
            var id = $(this).attr('id');
            updateNote({'id': id, 'left': ui.offset.left, 'top': ui.offset.top});
        }
    });
    
    // 可改变尺寸
    note.resizable({
        minWidth: 300,
        maxWidth: 800, 
        minHeight: 120, 
        maxHeight: 600,
        resize: function(event, ui) {
            var body = $(this).children('.note-body');
            body.height(ui.size.height - 32);
        },
        stop: function(event, ui) {
            var id = $(this).attr('id');
            updateNote({'id': id, 'width': ui.size.width});
            updateNote({'id': id, 'height': ui.size.height});
        }
    });
    
    note.children('.note-head').on('mousedown', function() {
        var n = $(this).parent('.note'); 
        n.css('z-index', 100);
        updateNote({id: n.attr('id'), z: 100});
        $('.note').each(function() {
            if (n.attr('id') != $(this).attr('id')) {
                $(this).css('z-index', 1);
                updateNote({id: $(this).attr('id'), z: 1});
            }
        });
    });
    
    note.children('.note-body').on('focus' ,function() {
        var n = $(this).parent('.note'); 
        n.css('z-index', 100);
        updateNote({id: n.attr('id'), z: 100});
        $('.note').each(function() {
            if (n.attr('id') != $(this).attr('id')) {
                $(this).css('z-index', 1);
                updateNote({id: $(this).attr('id'), z: 1});
            }
        });
    });
    
    // 自动保存
    note.children('.note-body').on('keyup paste' ,function() {
        var id = $(this).parent('.note').attr('id');
        var content = $(this).html();
        (function(id, title, content){
            stamp = new Date().getTime();
            setTimeout(function(){
                if (new Date().getTime() - stamp > 995) {
                    updateNote({'id': id, 'title': title, 'content': content});
                }
            }, 1000); 
        })(id, note.find('.note-title').text(), content);
    });

    // 修改便笺标题
    note.find('.note-title').dblclick(function() {
        var title = window.prompt('请输入新标题, 最多10个字符', $(this).text());
        if (title) {
            var id = $(this).parents('.note').attr('id');
            $(this).text(title.substr(0, 10));
            updateNote({'id': id, 'title': title});
        }
    });

    // 新建便笺
    note.find('.note-add').click(function() {
        createBlankNote();
    });

    // 折叠便笺
    note.find('.note-fold').click(function() {
        var body = note.children('.note-body');
        body.slideToggle();
        $(this).text($(this).text() == '折叠' ? '展开' : '折叠');
    });
    
    // 删除便笺
    note.find('.note-delete').click(function() {
        var sure = window.confirm('确定删除吗?');
        if (sure) {
            note.remove();
            deleteNote($(this).parents('.note').attr('id'));
        }
    });
}

function createNote(entity) {
    var id = entity.id;
    var title = entity.title;
    var content = entity.content;
    
    var note = $('<div class="note">').attr('id', id);
    var head = $('<div class="note-head note-draggable orange">');
    var body = $('<div contenteditable="true" class="note-body">').html(content || '');
    head.append($('<span class="note-title" title="双击修改标题">').text(title || '便笺' + id));
    head.append($('<span class="note-add not-draggable">').text('新建'));
    head.append($('<span class="note-fold not-draggable">').text('折叠'));
    head.append($('<span class="note-delete not-draggable">').text('关闭'));
    note.append(head).append(body);
    bindActions(note);
    
    if(entity.width)note.width(limit(300, 800, entity.width));
    if(entity.height)body.height(limit(120, 600, entity.height) - 32); 
    if(entity.left)note.offset({left: max(8, entity.left)});
    if(entity.top)note.offset({top: max(8, entity.top)});
    if(entity.z)note.css('z-index', entity.z);
    
    note.appendTo($('body')).show();
}

function updateNote(entity) {
    var entity_0 = readNote(entity.id);
    saveNote(join(entity_0, entity));
}

function saveNote(entity) {   
    localStorage[entity.id] = JSON.stringify(entity);
}

function readNote(id) {
    var entity = JSON.parse(localStorage[id]);
    return entity;
}

function deleteNote(id) {
    delete localStorage[id];
}

function loadNotes() {
    if (0 == localStorage.length) {
        createBlankNote();
    }
    else {
        for (id in localStorage){
            var entity = readNote(id);
            createNote(entity);
        }     
    }
}

function exportNotes() {
    var exports = [];
    if (localStorage) {
        var entity;
        for (id in localStorage){
            entity = readNote(id);
            exports.push(entity);
        }
        if (exports.length > 0) {
            var text = JSON.stringify(exports);
            //$('#output').val(text).show();
            var win = window.open('');
            var doc = win.document;
            doc.title = '导出数据';
            doc.write(text);
        }
    }
}

function createBlankNote()
{
    var entity = generateDefaultEntity();
    createNote(entity);
    saveNote(entity);
}

function generateDefaultEntity() {
    var id = generateId();
    var title = '便笺' + id;
    var content = '';
    var default_entity = {
        'id': id, 
        'title': title, 
        'content': content,
        'width': 300,
        'height': 120,
        'left': 8,
        'top': 8,
        'z': 1
    };
    
    return default_entity;
}

function limit(min, max, value) {
    if (value < min)return min;
    else if (value > max)return max;
    else return value;
}

function max(a, b) {
    return a > b ? a : b;s
}

function generateId()
{
    return new Date().getTime();
}

function join(obj1, obj2)
{
    if (undefined == obj1) {
        return obj2;
    }
    else {
        for (key in obj1) {
            obj1[key] = obj2[key] || obj1[key];
        }
    }
    
    return obj1;
}

function beautifyObject(obj) {
    
    var text = '';
    var fun = function(obj) {
        if (obj instanceof Array){
            text += '[';
            for (item in obj) {
                text += fun(obj[item]);
                text += ', ' 
            }
            text += ']';
        }
        else if (typeof obj == 'object') {
            text += '{';
            for (item in obj) {
                text += fun(obj[item]);
                text += ', ' 
            }
            text += '}'; 
        }
        else if (typeof obj == 'number' || typeof obj == 'string') {
            text += obj;
            console.log(text);
        }
    };
    fun(obj);
    return text;
}
