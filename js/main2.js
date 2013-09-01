var stamp;
var currentNote;
var properties = ["id", "title", "content", "width", "height", "left", "top", "z", "bgColor"];
var ID_ORIGIN;
var Z_1 = 1;
var Z_2 = 100;
var Z_3 = 200;

$(function() {
    initIdOrigin();
    
    loadNotes();
    
    addExportListener();
    
    addUpgradeListener();
    
    initColorPicker();
});

function addExportListener() {
    $('#export').on('click', function() {
        exportNotes();
    });
}

function addUpgradeListener() {
    $('#upgrade').on('click', function() {
        var entities = readAllNotes();
        var entity;
        var defaultEntity = generateDefaultEntity();
        for (i in entities) {
            defaultEntity.id = entities[i].id;
            entity = join(defaultEntity, entities[i]);
            saveNote(entity);
        }
        location.reload();
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
        currentNote = n;
        n.css('z-index', Z_2);
        updateNote({id: n.attr('id'), z: 100});
        $('.note').each(function() {
            if (n.attr('id') != $(this).attr('id')) {
                $(this).css('z-index', Z_1);
                updateNote({id: $(this).attr('id'), z: 1});
            }
        });
    });
    
    note.children('.note-body').on('focus' ,function() {
        var n = $(this).parent('.note'); 
        currentNote = n;
        n.css('z-index', Z_2);
        updateNote({id: n.attr('id'), z: 100});
        $('.note').each(function() {
            if (n.attr('id') != $(this).attr('id')) {
                $(this).css('z-index', Z_1);
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
        var title = window.prompt('请输入新标题', $(this).text());
        if (title) {
            var id = $(this).parents('.note').attr('id');
            $(this).text(title);
            updateNote({'id': id, 'title': title});
        }
    });

    // 修改背景色
    note.find('.note-color').click(function(e) {
        currentNote = $(this).parents('.note');
        popColorPicker({left: e.clientX, top: e.clientY});
    });

    // 新建便笺
    note.find('.note-add').click(function() {
        createBlankNote();
    });

    // 折叠便笺
    note.find('.note-fold').click(function() {
        var id = $(this).parents('.note').attr('id');
        var body = note.children('.note-body');
        body.slideToggle();
        var entity = {id: id};
        if ($(this).text() == '折') {
            $(this).text('展');
            entity.folded = true;
        }
        else {
            $(this).text('折');
            entity.folded = false;
        }
        updateNote(entity);
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

// 显示
function showNote(entity) {
    var id = entity.id;
    var title = entity.title;
    var content = entity.content;
    
    var note = $('<div class="note">').attr('id', id);
    var head = $('<div class="note-head note-draggable orange">');
    var body = $('<div contenteditable="true" class="note-body">').html(content || '');
    body.css({'background-color': entity.bgColor});
    head.append($('<span class="note-title" title="双击修改标题">').text(title || '便笺' + id));  
    head.append($('<span class="note-delete not-draggable">').text('删'));
    head.append($('<span class="note-color not-draggable">').text('色'));
    var foldLabel;
    if (entity.folded) {
        body.hide();
        foldLabel = '展';
    }
    else {
        foldLabel = '折';
    }
    head.append($('<span class="note-fold not-draggable">').text(foldLabel));
    head.append($('<span class="note-add not-draggable">').text('增'));

    
    note.append(head).append(body);
    bindActions(note);
    
    if(entity.width)note.width(limit(300, 800, entity.width));
    if(entity.height)body.height(limit(120, 600, entity.height) - 32); 
    if(entity.left)note.offset({left: max(8, entity.left)});
    if(entity.top)note.offset({top: max(8, entity.top)});
    if(entity.z)note.css('z-index', entity.z);
    
    note.appendTo($('body')).show();
}

// 改(合并)
function updateNote(entity) {
    var entity_0 = readNote(entity.id);
    saveNote(join(entity_0, entity));
}

// 增|改(覆盖)
function saveNote(entity) {   
    localStorage[entity.id] = JSON.stringify(entity);
}

// 读
function readNote(id) {
    try {
        var entity = JSON.parse(localStorage[id]);
        if (null != entity.id) return entity;
        else return null;
    }
    catch(e) {
        return null;
    }
}

// 读(所有)
function readAllNotes() {
    var entities = [];
    for (id in localStorage) {
        var entity = readNote(id);
        if (null != entity) {
            entities.push(entity);
        }
    }
    return entities;
}

// 删：
function deleteNote(id) {
    delete localStorage[id];
}

// 读(所有) && 显示
function loadNotes() {
    var entities = readAllNotes();
    if (0 == entities.length) {
        createBlankNote();
    }
    else {
        for (i in entities) {
            showNote(entities[i]);
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

function createBlankNote() {
    var entity = generateDefaultEntity();
    showNote(entity);
    saveNote(entity);
}

function popColorPicker(position) {
    var picker = $('.color-picker');
    picker.show();
    picker.offset(position);    
}

function initColorPicker() {
    var picker = $('.color-picker');
    var toolbar = $('<div class="pop-toolbar" />')
        .appendTo(picker);
    var closer = $('<span class="pop-closer" />').text('关闭');
    closer.click(function() {
        $('.color-picker').hide();
    }).appendTo(toolbar);
    
    var colors =[
        '#f56545', '#ffbb22', '#eeee22', '#bbe535', 
        '#77ddbb', '#66ccdd', '#b5c5c5',
        '#E9E9E9', '#FFCF88', '#B9B434', '#A0BB36', 
        '#B3E765', '#79C77F', '#8FB99E', '#499989', 
        '#6F84A8', '#6F84A8', '#A896D6', '#C699F0',
        '#BB8EC4'];
    
    for (i in colors) {
        var block = $('<div class="color-block" />')
            .css('background-color', colors[i]);
            
       (function(block){
            block.click(function() {
                var bgColor = block.css('background-color');
                currentNote.children('.note-body')
                    .css('background-color', bgColor);
                updateNote({'id': currentNote.attr('id'), 'bgColor': bgColor});
            });   
        })(block);
            
        picker.append(block);
    }    
}

function initIdOrigin() {
    var count = readAllNotes().length;
    var id_origin = localStorage['id_origin'];
    if (0 == count || null == id_origin) {
        ID_ORIGIN = new Date().getTime();
        localStorage['id_origin'] = ID_ORIGIN;
    }
    else 
    {
        ID_ORIGIN = id_origin;
    }
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
        'top': 40,
        'z': Z_3,
        'folded': false,
        'bgColor': '#ffbb22'
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
    return new Date().getTime() - ID_ORIGIN;
}

function join(obj1, obj2)
{
    if (undefined == obj1) {
        return obj2;
    }
    else {
        for (key in obj1) {
            if (0 === obj2[key] || false === obj2[key]) obj1[key] = obj2[key];
            else obj1[key] = obj2[key] || obj1[key];
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
        }
    };
    fun(obj);
    return text;
}
