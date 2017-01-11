Ext.Loader.setPath('Ext.ux', 'ext/src/ux');
Ext.Ajax.disableCaching = false;
Ext.Ajax.on({
    beforerequest: {
        fn: function (conn, options, eOpts) {

        },
        scope: this
    },
    requestcomplete: {
        fn: function (conn, response, options, eOpts) {

        },
        scope: this     
    },
    requestexception: {
        fn: function (conn, response, options, eOpts) {
            var code = response.status;
            var error = "";
            if (code === 401) {
                var result = Ext.decode(response.responseText);
                error = result.msg;
            }
            else {
                error = '错误代码:' + code + '，错误响应：' + response.responseText;
            }
            Ext.Msg.show({
                title: '错误',
                msg: error,
                buttons: Ext.Msg.OK,
                icon: Ext.Msg.ERROR
            });
        },
        scope:this
    }
});    
Ext.form.Field.prototype.msgTarget = 'side';            // turn on validation errors beside the field globally
//---------begin override form<-->model validation-------------------
//来源：http://existdissolve.com/2012/04/extjs-4-applying-model-validations-to-forms/

Ext.data.validations.minMessage = 'must be greater than or equal to the specified value';
Ext.data.validations.min = function (config, value) {
    if (!Ext.isNumeric(value) || value < config.min) {
        return false;
    }
    return true;
};
Ext.data.validations.maxMessage = 'must be less than or equal to the specified value';
Ext.data.validations.max = function (config, value) {
    if (!Ext.isNumeric(value) || value > config.max) {
        return false;
    }
    return true;
};
Ext.data.validations.rangeMessage = 'must be between the specified values';
Ext.data.validations.range = function (config, value) {
    if (!Ext.isNumeric(value) || (value > config.max || value < config.min)) {
        return false;
    }
    return true;
};    

Ext.override(Ext.form.field.Base, {
    setModelFieldValidation: function (validation) {
        this.modelValidations = Ext.isArray(this.modelValidations) ? this.modelValidations : [];
        this.modelValidations.push(validation);
    },
    getModelErrors: function (value) {
        var errors = Ext.create('Ext.data.Errors'),
            validations = this.modelValidations,
            validators = Ext.data.validations,
            length, validation, field, valid, type, i;

        if (validations) {
            length = validations.length;

            for (i = 0; i < length; i++) {
                validation = validations[i];
                field = validation.field || validation.name;
                type = validation.type;
                valid = validators[type](validation, value);

                if (!valid) {
                    errors.add({
                        field: field,
                        message: validation.message || validators[type + 'Message']
                    });
                }
            }
        }
        return errors;
    },
    validateValue: function (value) {                                   //重写了这个方法实现校验，实现了Field上自定义的VType与Model校验同时校验
        var me = this,
            errors = me.getErrors(value),
            modelErrors = me.getModelErrors(value),
            isValid = Ext.isEmpty(errors) && modelErrors.isValid();
        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            }
            else {
                if (!modelErrors.isValid()) {
                    modelErrors.each(function () {
                        errors.push(this.message);
                    });
                }
                me.markInvalid(errors);
            }
        }
        return isValid;
    }
});    

Ext.override(Ext.form.Basic, {
    loadRecord: function (record) {
        this._record = record;
        this.setModelValidations(record.validations);
        return this.setValues(record.data);
    },
    setModelValidations: function (validations) {
        var fields = this.getFields(), i;
        for (i = 0; i < validations.length; i++) {
            var fieldMatch = this.findField(validations[i].field);
            if (fieldMatch) {
                fieldMatch.setModelFieldValidation(validations[i]);
            }
        }
    }
});    

//---------end override form<-->model validation-------------------

//Ext.toolbar.Toolbar.override({
//	getRefItems: function(deep) {
//		var result = this.callOverridden(arguments),
//			h;
//		if (this.enableOverflow) {
//			h = this.layout.overflowHandler;
//			if (h instanceof Ext.layout.container.boxOverflow.Menu && h.menuTrigger) {
//				h = h.menuTrigger;
//				result.push(h);
//				if (deep && h.getRefItems) {
//					result.push.apply(result, h.getRefItems(true));
//				}
//			}
//		}
//		return result;
//	}
//}); 

Ext.require(['Ext.container.Viewport', 'Ext.ux.grid.filter.Filter', 'Ext.ux.grid.filter.DateFilter', 'Ext.panel.Panel', 'Ext.ux.grid.FiltersFeature', 'Ext.ux.grid.*'],
            function () {
                //--------------这个重写用来实现在点击日期时自动将菜单选中,当前是不选中的，可能是Bug，但目前这个重写只有放在有表格的类下面，比如UserList.js的后面时才起作用，在appMain中就不好用-----------------
                //http://www.sencha.com/forum/showthread.php?258465-4.2.0-RC-FiltersFeature-DateFilter-initiates-request-on-picker-click-without-filter
                Ext.create('Ext.ux.grid.filter.DateFilter', {});
                Ext.override(Ext.ux.grid.filter.DateFilter, {
                    onPickerSelect: function (picker, date) {
                        this.values[picker.itemId] = date;
                        picker.up('menu').hide();
                        this.fields[picker.itemId].setChecked(true);
                        this.fireEvent('update', this);
                    }
                });
            }
           );

Ext.define('Ext.selection.CheckboxTreeModel', {
    alias: 'selection.checkboxtreemodel',
    extend: 'Ext.selection.CheckboxModel',
    onStoreRemove: function (store, records, indexes, isMove) {
        var me = this;

        // If the selection start point is among records being removed, we no longer have a selection start point.
        if (me.selectionStart && Ext.Array.contains(records, me.selectionStart)) {
            me.selectionStart = null;
        }

        if (isMove || me.locked || !me.pruneRemoved) {
            return;
        }
        //me.deselectDeletedRecords(records);
    }
});