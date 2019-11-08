function nullNext(obj, notNullFunc, nullFunc) {
	if (obj) {
		notNullFunc(obj);
	} else {
		if (nullFunc) {
			nullFunc();
		}
	}
}


var startEndChar = {
			'{':'}',
			'(':')',
			'"':'"',
			"'":"'"}

var specalCharArr = "WdxUtils.nullNext";
var statusMap = {};
statusMap[specalCharArr.indexOf('W')] = 1;
statusMap[100 + specalCharArr.indexOf('d')] = 2;
statusMap[2 * 100 + specalCharArr.indexOf('x')] = 3;
statusMap[3 * 100 + specalCharArr.indexOf('U')] = 4;
statusMap[4 * 100 + specalCharArr.indexOf('t')] = 5;
statusMap[5 * 100 + specalCharArr.indexOf('i')] = 6;
statusMap[6 * 100 + specalCharArr.indexOf('l')] = 7;
statusMap[7 * 100 + specalCharArr.indexOf('s')] = 8;
statusMap[8 * 100 + specalCharArr.indexOf('.')] = 9;
statusMap[9 * 100 + specalCharArr.indexOf('n')] = 10;
statusMap[10 * 100 + specalCharArr.indexOf('u')] = 11;
statusMap[11 * 100 + specalCharArr.indexOf('l')] = 12;
statusMap[12 * 100 + specalCharArr.indexOf('l')] = 13;
statusMap[13 * 100 + specalCharArr.indexOf('N')] = 14;
statusMap[14 * 100 + specalCharArr.indexOf('e')] = 15;
statusMap[15 * 100 + specalCharArr.indexOf('x')] = 16;
statusMap[16 * 100 + specalCharArr.indexOf('t')] = 17;


function doWithString(reader, sb, endWith, getEndChar) {
    var status = 0;
    var readEnd = false;
    while(!readEnd) {
        nullNext(reader.next(), curChar => {
            var endChar = getEndChar(() => startEndChar[curChar]);
            if (endChar) {
                sb.append(curChar);
                if ('"' == endChar || "'" == endChar) {
                    doWithString(reader, sb, endChar, defaultOper => null);
                } else {
                    doWithString(reader, sb, endChar, funcIn => funcIn());
                }
                sb.append(endChar);
                return;
            }
            if ("\\" == curChar && 0 == status) {
            	sb.append("\\");
            	sb.append(reader.next());
            	return;
            }
            if (curChar == endWith) {
                for (i = 0; i < status; i++) {
                    sb.append(specalCharArr[i]);
                }
                readEnd = true;
                return;
            }
            var preStatus = status;
            nullNext(statusMap[preStatus * 100 + specalCharArr.indexOf(curChar)], newStatus => {
                if (17 == newStatus) {
                    doWithNullNext(reader, sb);
                    status = 0;
                } else {
                    status = newStatus;
                }

            }, () => {
                status = 0;
                for (i = 0; i < preStatus; i++) {
                    sb.append(specalCharArr[i]);
                }
                sb.append(curChar);
            });
        }, () => readEnd = true);
    }
}




var nullNextCharArr = ['(', ',', '-', '>', ')'];
var operOfNullNextMap = {};
operOfNullNextMap[nullNextCharArr.indexOf('(')] = context => {
        doWithString(context.reader, context.varValueSb, ',', funcIn => funcIn());
        doWithString(context.reader, context.varNameSb, '-', funcIn => funcIn());
    };
operOfNullNextMap[3 * 100 + nullNextCharArr.indexOf('>')] = context => doWithString(context.reader, context.notNullCodeSb, ',', funcIn => funcIn());
operOfNullNextMap[8 * 100 + nullNextCharArr.indexOf('>')] = context => doWithString(context.reader, context.nullCodeSb, ')', funcIn => funcIn());

var statusOfNullNextMap = {};
statusOfNullNextMap[nullNextCharArr.indexOf('(')] = 3;
statusOfNullNextMap[3 * 100 + nullNextCharArr.indexOf('>')] = 5;
statusOfNullNextMap[5 * 100 + nullNextCharArr.indexOf('(')] = 6;
statusOfNullNextMap[6 * 100 + nullNextCharArr.indexOf(')')] = 7;
statusOfNullNextMap[7 * 100 + nullNextCharArr.indexOf('-')] = 8;
statusOfNullNextMap[8 * 100 + nullNextCharArr.indexOf('>')] = 10;
statusOfNullNextMap[5 * 100 + nullNextCharArr.indexOf(')')] = 10;







function doWithNullNext(reader, sb) {
    var status = 0;
    var readEnd = false;
    var context = {
    	reader: reader,
    	sb: sb,
    	varNameSb:  {
				strInner: "",
				append: function(toAdd) {
					this.strInner += toAdd;
				}
			},
    	varValueSb:  {
				strInner: "",
				append: function(toAdd) {
					this.strInner += toAdd;
				}
			},
    	notNullCodeSb:  {
				strInner: "",
				append: function(toAdd) {
					this.strInner += toAdd;
				}
			},
    	nullCodeSb:  {
				strInner: "",
				append: function(toAdd) {
					this.strInner += toAdd;
				}
			}
    };
    while(!readEnd) {
        nullNext(reader.next(), curChar => {
            nullNext(operOfNullNextMap[status * 100 + nullNextCharArr.indexOf(curChar)], oper => oper(context), null);
            nullNext(statusOfNullNextMap[status * 100 + nullNextCharArr.indexOf(curChar)], newStatus => {
                if (10 == newStatus) {
                    sb.append("Void ");
                    sb.append(context.varNameSb.strInner.trim());
                    sb.append(" = ");
                    sb.append(context.varValueSb.strInner.trim());
                    sb.append(";\n");
                    sb.append("if (null != ");
                    sb.append(context.varNameSb.strInner.trim());
                    var notNullStr = context.notNullCodeSb.strInner.trim();
                    if (!notNullStr.startsWith("{")) {
                        sb.append(") {\n");
                    } else {
                        sb.append(") ");
                    }
                    sb.append(notNullStr);
                    if (!notNullStr.endsWith("}")) {
                        sb.append(";\n}");
                    } else if (!notNullStr.startsWith("{")) {
                        sb.append("\n}");
                    }
                    if (0 < context.nullCodeSb.strInner.length) {
                        var nullStr = context.nullCodeSb.strInner.trim();
                        if (!nullStr.startsWith("{")) {
                            sb.append(" else {\n");
                        } else {
                            sb.append(" else ");
                        }
                        sb.append(nullStr);
                        if (!nullStr.endsWith("}")) {
                            sb.append(";\n}");
                        } else if (!nullStr.startsWith("{")) {
                            sb.append("\n}");
                        }
                    }
                    reader.passTheChar(';');
                    readEnd = true;
                } else {
                    status = newStatus;
                }
            }, null);
        }, () => readEnd = true);
    }
}


function parseNullNext(inPara) {
	var myReader = {
		str: inPara,
		idx: 0,
		passChar: null,
		next: function () {
			if (this.idx >= this.str.length) {
				return null;
			}
			var tryRet = this.str[this.idx++];
			if (this.passChar && this.passChar == tryRet) {
				this.passChar = null;
				return this.next();
			}
			return tryRet;
		},
		passTheChar: function (passChar) {
			this.passChar = passChar;
		}
	}
	var sb = {
		strInner: "",
		append: function(toAdd) {
			this.strInner += toAdd;
		}
	}
	doWithString(myReader, sb, null, funcIn => funcIn());
	return sb.strInner;
}

