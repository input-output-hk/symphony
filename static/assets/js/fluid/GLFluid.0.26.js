function IOHP2(where){

(function (console) { "use strict";
var $hxClasses = {},$estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
$hxClasses["EReg"] = EReg;
EReg.__name__ = true;
EReg.prototype = {
	match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,replace: function(s,by) {
		return s.replace(this.r,by);
	}
	,__class__: EReg
};
var GPUFluid = function(width,height,cellSize,solverIterations) {
	if(solverIterations == null) solverIterations = 18;
	if(cellSize == null) cellSize = 8;
	this.clearPressureShader = new ClearPressure();
	this.clearVelocityShader = new ClearVelocity();
	this.pressureGradientSubstractShader = new PressureGradientSubstract();
	this.pressureSolveShader = new PressureSolve();
	this.divergenceShader = new Divergence();
	this.advectVelocityShader = new AdvectVelocity();
	this.advectShader = new Advect();
	this.width = width;
	this.height = height;
	this.solverIterations = solverIterations;
	this.aspectRatio = this.width / this.height;
	this.cellSize = cellSize;
	var _this = this.advectShader.rdx;
	_this.dirty = true;
	_this.data = 1 / this.cellSize;
	var _this1 = this.advectVelocityShader.rdx;
	_this1.dirty = true;
	_this1.data = 1 / this.cellSize;
	var _this2 = this.divergenceShader.halfrdx;
	_this2.dirty = true;
	_this2.data = 0.5 * (1 / this.cellSize);
	var _this3 = this.pressureGradientSubstractShader.halfrdx;
	_this3.dirty = true;
	_this3.data = 0.5 * (1 / this.cellSize);
	var _this4 = this.pressureSolveShader.alpha;
	_this4.dirty = true;
	_this4.data = -this.cellSize * this.cellSize;
	this.textureQuad = gltoolbox_GeometryTools.getCachedUnitQuad();
	this.velocityRenderTarget = new gltoolbox_render_RenderTarget2Phase(width,height,function(width1,height1) {
		return gltoolbox_TextureTools.createTexture(width1,height1,{ channelType : 6408, dataType : 5121, filter : 9729});
	});
	this.pressureRenderTarget = new gltoolbox_render_RenderTarget2Phase(width,height,function(width2,height2) {
		return gltoolbox_TextureTools.createTexture(width2,height2,{ channelType : 6407, dataType : 5121, filter : 9728});
	});
	this.divergenceRenderTarget = new gltoolbox_render_RenderTarget(width,height,function(width3,height3) {
		return gltoolbox_TextureTools.createTexture(width3,height3,{ channelType : 6407, dataType : 5121, filter : 9728});
	});
	this.dyeRenderTarget = new gltoolbox_render_RenderTarget2Phase(width,height,function(width4,height4) {
		return gltoolbox_TextureTools.createTexture(width4,height4,{ channelType : 6407, dataType : 5121, filter : 9729});
	});
	this.updateAllCoreShaderUniforms();
	snow_modules_opengl_web_GL.current_context.viewport(0,0,this.width,this.height);
	snow_modules_opengl_web_GL.current_context.disable(3042);
	snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
	var shader = this.clearVelocityShader;
	if(shader._active) {
		var _g = 0;
		var _g1 = shader._uniforms;
		while(_g < _g1.length) {
			var u = _g1[_g];
			++_g;
			u.apply();
		}
		var offset = 0;
		var _g11 = 0;
		var _g2 = shader._attributes.length;
		while(_g11 < _g2) {
			var i = _g11++;
			var att = shader._attributes[i];
			var location = att.location;
			if(location != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
			}
			offset += att.byteSize;
		}
	} else {
		if(!shader._ready) shader.create();
		snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
		var _g3 = 0;
		var _g12 = shader._uniforms;
		while(_g3 < _g12.length) {
			var u1 = _g12[_g3];
			++_g3;
			u1.apply();
		}
		var offset1 = 0;
		var _g13 = 0;
		var _g4 = shader._attributes.length;
		while(_g13 < _g4) {
			var i1 = _g13++;
			var att1 = shader._attributes[i1];
			var location1 = att1.location;
			if(location1 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
			}
			offset1 += att1.byteSize;
		}
		shader._active = true;
	}
	this.velocityRenderTarget.activate();
	snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
	shader.deactivate();
	var _this5 = this.velocityRenderTarget;
	_this5.tmpFBO = _this5.writeFrameBufferObject;
	_this5.writeFrameBufferObject = _this5.readFrameBufferObject;
	_this5.readFrameBufferObject = _this5.tmpFBO;
	_this5.tmpTex = _this5.writeToTexture;
	_this5.writeToTexture = _this5.readFromTexture;
	_this5.readFromTexture = _this5.tmpTex;
	var shader1 = this.clearPressureShader;
	if(shader1._active) {
		var _g5 = 0;
		var _g14 = shader1._uniforms;
		while(_g5 < _g14.length) {
			var u2 = _g14[_g5];
			++_g5;
			u2.apply();
		}
		var offset2 = 0;
		var _g15 = 0;
		var _g6 = shader1._attributes.length;
		while(_g15 < _g6) {
			var i2 = _g15++;
			var att2 = shader1._attributes[i2];
			var location2 = att2.location;
			if(location2 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
			}
			offset2 += att2.byteSize;
		}
	} else {
		if(!shader1._ready) shader1.create();
		snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
		var _g7 = 0;
		var _g16 = shader1._uniforms;
		while(_g7 < _g16.length) {
			var u3 = _g16[_g7];
			++_g7;
			u3.apply();
		}
		var offset3 = 0;
		var _g17 = 0;
		var _g8 = shader1._attributes.length;
		while(_g17 < _g8) {
			var i3 = _g17++;
			var att3 = shader1._attributes[i3];
			var location3 = att3.location;
			if(location3 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
			}
			offset3 += att3.byteSize;
		}
		shader1._active = true;
	}
	this.pressureRenderTarget.activate();
	snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
	shader1.deactivate();
	var _this6 = this.pressureRenderTarget;
	_this6.tmpFBO = _this6.writeFrameBufferObject;
	_this6.writeFrameBufferObject = _this6.readFrameBufferObject;
	_this6.readFrameBufferObject = _this6.tmpFBO;
	_this6.tmpTex = _this6.writeToTexture;
	_this6.writeToTexture = _this6.readFromTexture;
	_this6.readFromTexture = _this6.tmpTex;
	var _this7 = this.dyeRenderTarget;
	snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this7.readFrameBufferObject);
	snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
	snow_modules_opengl_web_GL.current_context.clear(16384);
	snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this7.writeFrameBufferObject);
	snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
	snow_modules_opengl_web_GL.current_context.clear(16384);
};
$hxClasses["GPUFluid"] = GPUFluid;
GPUFluid.__name__ = true;
GPUFluid.prototype = {
	updateAllCoreShaderUniforms: function() {
		var shader = this.advectShader;
		if(shader == null) {
		} else {
			var _this = shader.aspectRatio;
			_this.dirty = true;
			_this.data = this.aspectRatio;
			shader.invresolution.data.x = 1 / this.width;
			shader.invresolution.data.y = 1 / this.height;
		}
		var shader1 = this.advectVelocityShader;
		if(shader1 == null) {
		} else {
			var _this1 = shader1.aspectRatio;
			_this1.dirty = true;
			_this1.data = this.aspectRatio;
			shader1.invresolution.data.x = 1 / this.width;
			shader1.invresolution.data.y = 1 / this.height;
		}
		var shader2 = this.divergenceShader;
		if(shader2 == null) {
		} else {
			var _this2 = shader2.aspectRatio;
			_this2.dirty = true;
			_this2.data = this.aspectRatio;
			shader2.invresolution.data.x = 1 / this.width;
			shader2.invresolution.data.y = 1 / this.height;
		}
		var shader3 = this.pressureSolveShader;
		if(shader3 == null) {
		} else {
			var _this3 = shader3.aspectRatio;
			_this3.dirty = true;
			_this3.data = this.aspectRatio;
			shader3.invresolution.data.x = 1 / this.width;
			shader3.invresolution.data.y = 1 / this.height;
		}
		var shader4 = this.pressureGradientSubstractShader;
		if(shader4 == null) {
		} else {
			var _this4 = shader4.aspectRatio;
			_this4.dirty = true;
			_this4.data = this.aspectRatio;
			shader4.invresolution.data.x = 1 / this.width;
			shader4.invresolution.data.y = 1 / this.height;
		}
		var shader5 = this.clearVelocityShader;
		if(shader5 == null) {
		} else {
			var _this5 = shader5.aspectRatio;
			_this5.dirty = true;
			_this5.data = this.aspectRatio;
			shader5.invresolution.data.x = 1 / this.width;
			shader5.invresolution.data.y = 1 / this.height;
		}
		var shader6 = this.clearPressureShader;
		if(shader6 == null) {
		} else {
			var _this6 = shader6.aspectRatio;
			_this6.dirty = true;
			_this6.data = this.aspectRatio;
			shader6.invresolution.data.x = 1 / this.width;
			shader6.invresolution.data.y = 1 / this.height;
		}
		var shader7 = this.applyForcesShader;
		if(shader7 == null) {
		} else {
			var _this7 = shader7.aspectRatio;
			_this7.dirty = true;
			_this7.data = this.aspectRatio;
			shader7.invresolution.data.x = 1 / this.width;
			shader7.invresolution.data.y = 1 / this.height;
		}
		var shader8 = this.updateDyeShader;
		if(shader8 == null) {
		} else {
			var _this8 = shader8.aspectRatio;
			_this8.dirty = true;
			_this8.data = this.aspectRatio;
			shader8.invresolution.data.x = 1 / this.width;
			shader8.invresolution.data.y = 1 / this.height;
		}
	}
	,step: function(dt) {
		snow_modules_opengl_web_GL.current_context.viewport(0,0,this.width,this.height);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
		var _this = this.advectVelocityShader.dt;
		_this.dirty = true;
		_this.data = dt;
		var _this1 = this.advectVelocityShader.velocity;
		_this1.dirty = true;
		_this1.data = this.velocityRenderTarget.readFromTexture;
		var shader = this.advectVelocityShader;
		if(shader._active) {
			var _g = 0;
			var _g1 = shader._uniforms;
			while(_g < _g1.length) {
				var u = _g1[_g];
				++_g;
				u.apply();
			}
			var offset = 0;
			var _g11 = 0;
			var _g2 = shader._attributes.length;
			while(_g11 < _g2) {
				var i = _g11++;
				var att = shader._attributes[i];
				var location = att.location;
				if(location != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
				}
				offset += att.byteSize;
			}
		} else {
			if(!shader._ready) shader.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
			var _g3 = 0;
			var _g12 = shader._uniforms;
			while(_g3 < _g12.length) {
				var u1 = _g12[_g3];
				++_g3;
				u1.apply();
			}
			var offset1 = 0;
			var _g13 = 0;
			var _g4 = shader._attributes.length;
			while(_g13 < _g4) {
				var i1 = _g13++;
				var att1 = shader._attributes[i1];
				var location1 = att1.location;
				if(location1 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
				}
				offset1 += att1.byteSize;
			}
			shader._active = true;
		}
		this.velocityRenderTarget.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader.deactivate();
		var _this2 = this.velocityRenderTarget;
		_this2.tmpFBO = _this2.writeFrameBufferObject;
		_this2.writeFrameBufferObject = _this2.readFrameBufferObject;
		_this2.readFrameBufferObject = _this2.tmpFBO;
		_this2.tmpTex = _this2.writeToTexture;
		_this2.writeToTexture = _this2.readFromTexture;
		_this2.readFromTexture = _this2.tmpTex;
		if(this.applyForcesShader == null) {
		} else {
			var _this3 = this.applyForcesShader.dt;
			_this3.dirty = true;
			_this3.data = dt;
			var _this4 = this.applyForcesShader.velocity;
			_this4.dirty = true;
			_this4.data = this.velocityRenderTarget.readFromTexture;
			var shader1 = this.applyForcesShader;
			if(shader1._active) {
				var _g5 = 0;
				var _g14 = shader1._uniforms;
				while(_g5 < _g14.length) {
					var u2 = _g14[_g5];
					++_g5;
					u2.apply();
				}
				var offset2 = 0;
				var _g15 = 0;
				var _g6 = shader1._attributes.length;
				while(_g15 < _g6) {
					var i2 = _g15++;
					var att2 = shader1._attributes[i2];
					var location2 = att2.location;
					if(location2 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
					}
					offset2 += att2.byteSize;
				}
			} else {
				if(!shader1._ready) shader1.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
				var _g7 = 0;
				var _g16 = shader1._uniforms;
				while(_g7 < _g16.length) {
					var u3 = _g16[_g7];
					++_g7;
					u3.apply();
				}
				var offset3 = 0;
				var _g17 = 0;
				var _g8 = shader1._attributes.length;
				while(_g17 < _g8) {
					var i3 = _g17++;
					var att3 = shader1._attributes[i3];
					var location3 = att3.location;
					if(location3 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
					}
					offset3 += att3.byteSize;
				}
				shader1._active = true;
			}
			this.velocityRenderTarget.activate();
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader1.deactivate();
			var _this5 = this.velocityRenderTarget;
			_this5.tmpFBO = _this5.writeFrameBufferObject;
			_this5.writeFrameBufferObject = _this5.readFrameBufferObject;
			_this5.readFrameBufferObject = _this5.tmpFBO;
			_this5.tmpTex = _this5.writeToTexture;
			_this5.writeToTexture = _this5.readFromTexture;
			_this5.readFromTexture = _this5.tmpTex;
		}
		var _this6 = this.divergenceShader.velocity;
		_this6.dirty = true;
		_this6.data = this.velocityRenderTarget.readFromTexture;
		var shader2 = this.divergenceShader;
		if(shader2._active) {
			var _g9 = 0;
			var _g18 = shader2._uniforms;
			while(_g9 < _g18.length) {
				var u4 = _g18[_g9];
				++_g9;
				u4.apply();
			}
			var offset4 = 0;
			var _g19 = 0;
			var _g10 = shader2._attributes.length;
			while(_g19 < _g10) {
				var i4 = _g19++;
				var att4 = shader2._attributes[i4];
				var location4 = att4.location;
				if(location4 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location4);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location4,att4.itemCount,att4.type,false,shader2._aStride,offset4);
				}
				offset4 += att4.byteSize;
			}
		} else {
			if(!shader2._ready) shader2.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader2._prog);
			var _g20 = 0;
			var _g110 = shader2._uniforms;
			while(_g20 < _g110.length) {
				var u5 = _g110[_g20];
				++_g20;
				u5.apply();
			}
			var offset5 = 0;
			var _g111 = 0;
			var _g21 = shader2._attributes.length;
			while(_g111 < _g21) {
				var i5 = _g111++;
				var att5 = shader2._attributes[i5];
				var location5 = att5.location;
				if(location5 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location5);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location5,att5.itemCount,att5.type,false,shader2._aStride,offset5);
				}
				offset5 += att5.byteSize;
			}
			shader2._active = true;
		}
		this.divergenceRenderTarget.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader2.deactivate();
		var _this7 = this.pressureSolveShader.divergence;
		_this7.dirty = true;
		_this7.data = this.divergenceRenderTarget.texture;
		var _this8 = this.pressureSolveShader;
		if(_this8._active) {
			var _g22 = 0;
			var _g112 = _this8._uniforms;
			while(_g22 < _g112.length) {
				var u6 = _g112[_g22];
				++_g22;
				u6.apply();
			}
			var offset6 = 0;
			var _g113 = 0;
			var _g23 = _this8._attributes.length;
			while(_g113 < _g23) {
				var i6 = _g113++;
				var att6 = _this8._attributes[i6];
				var location6 = att6.location;
				if(location6 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location6);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location6,att6.itemCount,att6.type,false,_this8._aStride,offset6);
				}
				offset6 += att6.byteSize;
			}
		} else {
			if(!_this8._ready) _this8.create();
			snow_modules_opengl_web_GL.current_context.useProgram(_this8._prog);
			var _g24 = 0;
			var _g114 = _this8._uniforms;
			while(_g24 < _g114.length) {
				var u7 = _g114[_g24];
				++_g24;
				u7.apply();
			}
			var offset7 = 0;
			var _g115 = 0;
			var _g25 = _this8._attributes.length;
			while(_g115 < _g25) {
				var i7 = _g115++;
				var att7 = _this8._attributes[i7];
				var location7 = att7.location;
				if(location7 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location7);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location7,att7.itemCount,att7.type,false,_this8._aStride,offset7);
				}
				offset7 += att7.byteSize;
			}
			_this8._active = true;
		}
		var _g116 = 0;
		var _g26 = this.solverIterations;
		while(_g116 < _g26) {
			_g116++;
			var _this9 = this.pressureSolveShader.pressure;
			var tmp;
			_this9.dirty = true;
			tmp = _this9.data = this.pressureRenderTarget.readFromTexture;
			var _g27 = 0;
			var _g117 = this.pressureSolveShader._uniforms;
			while(_g27 < _g117.length) {
				var u8 = _g117[_g27];
				++_g27;
				u8.apply();
			}
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.pressureRenderTarget.writeFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			var _this10 = this.pressureRenderTarget;
			_this10.tmpFBO = _this10.writeFrameBufferObject;
			_this10.writeFrameBufferObject = _this10.readFrameBufferObject;
			_this10.readFrameBufferObject = _this10.tmpFBO;
			_this10.tmpTex = _this10.writeToTexture;
			_this10.writeToTexture = _this10.readFromTexture;
			_this10.readFromTexture = _this10.tmpTex;
		}
		this.pressureSolveShader.deactivate();
		var _this11 = this.pressureGradientSubstractShader.pressure;
		_this11.dirty = true;
		_this11.data = this.pressureRenderTarget.readFromTexture;
		var _this12 = this.pressureGradientSubstractShader.velocity;
		_this12.dirty = true;
		_this12.data = this.velocityRenderTarget.readFromTexture;
		var shader3 = this.pressureGradientSubstractShader;
		if(shader3._active) {
			var _g28 = 0;
			var _g118 = shader3._uniforms;
			while(_g28 < _g118.length) {
				var u9 = _g118[_g28];
				++_g28;
				u9.apply();
			}
			var offset8 = 0;
			var _g119 = 0;
			var _g29 = shader3._attributes.length;
			while(_g119 < _g29) {
				var i8 = _g119++;
				var att8 = shader3._attributes[i8];
				var location8 = att8.location;
				if(location8 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location8);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location8,att8.itemCount,att8.type,false,shader3._aStride,offset8);
				}
				offset8 += att8.byteSize;
			}
		} else {
			if(!shader3._ready) shader3.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader3._prog);
			var _g30 = 0;
			var _g120 = shader3._uniforms;
			while(_g30 < _g120.length) {
				var u10 = _g120[_g30];
				++_g30;
				u10.apply();
			}
			var offset9 = 0;
			var _g121 = 0;
			var _g31 = shader3._attributes.length;
			while(_g121 < _g31) {
				var i9 = _g121++;
				var att9 = shader3._attributes[i9];
				var location9 = att9.location;
				if(location9 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location9);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location9,att9.itemCount,att9.type,false,shader3._aStride,offset9);
				}
				offset9 += att9.byteSize;
			}
			shader3._active = true;
		}
		this.velocityRenderTarget.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader3.deactivate();
		var _this13 = this.velocityRenderTarget;
		_this13.tmpFBO = _this13.writeFrameBufferObject;
		_this13.writeFrameBufferObject = _this13.readFrameBufferObject;
		_this13.readFrameBufferObject = _this13.tmpFBO;
		_this13.tmpTex = _this13.writeToTexture;
		_this13.writeToTexture = _this13.readFromTexture;
		_this13.readFromTexture = _this13.tmpTex;
		if(this.updateDyeShader == null) {
		} else {
			var _this14 = this.updateDyeShader.dt;
			_this14.dirty = true;
			_this14.data = dt;
			var _this15 = this.updateDyeShader.dye;
			_this15.dirty = true;
			_this15.data = this.dyeRenderTarget.readFromTexture;
			var shader4 = this.updateDyeShader;
			if(shader4._active) {
				var _g32 = 0;
				var _g122 = shader4._uniforms;
				while(_g32 < _g122.length) {
					var u11 = _g122[_g32];
					++_g32;
					u11.apply();
				}
				var offset10 = 0;
				var _g123 = 0;
				var _g33 = shader4._attributes.length;
				while(_g123 < _g33) {
					var i10 = _g123++;
					var att10 = shader4._attributes[i10];
					var location10 = att10.location;
					if(location10 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location10);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location10,att10.itemCount,att10.type,false,shader4._aStride,offset10);
					}
					offset10 += att10.byteSize;
				}
			} else {
				if(!shader4._ready) shader4.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader4._prog);
				var _g34 = 0;
				var _g124 = shader4._uniforms;
				while(_g34 < _g124.length) {
					var u12 = _g124[_g34];
					++_g34;
					u12.apply();
				}
				var offset11 = 0;
				var _g125 = 0;
				var _g35 = shader4._attributes.length;
				while(_g125 < _g35) {
					var i11 = _g125++;
					var att11 = shader4._attributes[i11];
					var location11 = att11.location;
					if(location11 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location11);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location11,att11.itemCount,att11.type,false,shader4._aStride,offset11);
					}
					offset11 += att11.byteSize;
				}
				shader4._active = true;
			}
			this.dyeRenderTarget.activate();
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader4.deactivate();
			var _this16 = this.dyeRenderTarget;
			_this16.tmpFBO = _this16.writeFrameBufferObject;
			_this16.writeFrameBufferObject = _this16.readFrameBufferObject;
			_this16.readFrameBufferObject = _this16.tmpFBO;
			_this16.tmpTex = _this16.writeToTexture;
			_this16.writeToTexture = _this16.readFromTexture;
			_this16.readFromTexture = _this16.tmpTex;
		}
		var target = this.dyeRenderTarget;
		var _this17 = this.advectShader.dt;
		_this17.dirty = true;
		_this17.data = dt;
		var _this18 = this.advectShader.target;
		_this18.dirty = true;
		_this18.data = target.readFromTexture;
		var _this19 = this.advectShader.velocity;
		_this19.dirty = true;
		_this19.data = this.velocityRenderTarget.readFromTexture;
		var shader5 = this.advectShader;
		if(shader5._active) {
			var _g36 = 0;
			var _g126 = shader5._uniforms;
			while(_g36 < _g126.length) {
				var u13 = _g126[_g36];
				++_g36;
				u13.apply();
			}
			var offset12 = 0;
			var _g127 = 0;
			var _g37 = shader5._attributes.length;
			while(_g127 < _g37) {
				var i12 = _g127++;
				var att12 = shader5._attributes[i12];
				var location12 = att12.location;
				if(location12 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location12);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location12,att12.itemCount,att12.type,false,shader5._aStride,offset12);
				}
				offset12 += att12.byteSize;
			}
		} else {
			if(!shader5._ready) shader5.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader5._prog);
			var _g38 = 0;
			var _g128 = shader5._uniforms;
			while(_g38 < _g128.length) {
				var u14 = _g128[_g38];
				++_g38;
				u14.apply();
			}
			var offset13 = 0;
			var _g129 = 0;
			var _g39 = shader5._attributes.length;
			while(_g129 < _g39) {
				var i13 = _g129++;
				var att13 = shader5._attributes[i13];
				var location13 = att13.location;
				if(location13 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location13);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location13,att13.itemCount,att13.type,false,shader5._aStride,offset13);
				}
				offset13 += att13.byteSize;
			}
			shader5._active = true;
		}
		target.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader5.deactivate();
		target.tmpFBO = target.writeFrameBufferObject;
		target.writeFrameBufferObject = target.readFrameBufferObject;
		target.readFrameBufferObject = target.tmpFBO;
		target.tmpTex = target.writeToTexture;
		target.writeToTexture = target.readFromTexture;
		target.readFromTexture = target.tmpTex;
	}
	,__class__: GPUFluid
};
var shaderblox_ShaderBase = function() {
	this._textures = [];
	this._attributes = [];
	this._uniforms = [];
	this._name = ("" + Std.string(js_Boot.getClass(this))).split(".").pop();
	this.initSources();
	this.createProperties();
};
$hxClasses["shaderblox.ShaderBase"] = shaderblox_ShaderBase;
shaderblox_ShaderBase.__name__ = true;
shaderblox_ShaderBase.prototype = {
	initSources: function() {
	}
	,createProperties: function() {
	}
	,create: function() {
		this.compile(this._vertSource,this._fragSource);
		this._ready = true;
	}
	,compile: function(vertSource,fragSource) {
		var vertexShader = snow_modules_opengl_web_GL.current_context.createShader(35633);
		snow_modules_opengl_web_GL.current_context.shaderSource(vertexShader,vertSource);
		snow_modules_opengl_web_GL.current_context.compileShader(vertexShader);
		if(snow_modules_opengl_web_GL.current_context.getShaderParameter(vertexShader,35713) == 0) throw new js__$Boot_HaxeError("Error compiling vertex shader");
		var fragmentShader = snow_modules_opengl_web_GL.current_context.createShader(35632);
		snow_modules_opengl_web_GL.current_context.shaderSource(fragmentShader,fragSource);
		snow_modules_opengl_web_GL.current_context.compileShader(fragmentShader);
		if(snow_modules_opengl_web_GL.current_context.getShaderParameter(fragmentShader,35713) == 0) {
			var lines = fragSource.split("\n");
			var i = 0;
			var _g = 0;
			while(_g < lines.length) {
				var l = lines[_g];
				++_g;
				null;
			}
			throw new js__$Boot_HaxeError("Error compiling fragment shader");
		}
		var shaderProgram = snow_modules_opengl_web_GL.current_context.createProgram();
		snow_modules_opengl_web_GL.current_context.attachShader(shaderProgram,vertexShader);
		snow_modules_opengl_web_GL.current_context.attachShader(shaderProgram,fragmentShader);
		snow_modules_opengl_web_GL.current_context.linkProgram(shaderProgram);
		if(snow_modules_opengl_web_GL.current_context.getProgramParameter(shaderProgram,35714) == 0) throw new js__$Boot_HaxeError("Unable to initialize the shader program.\n" + snow_modules_opengl_web_GL.current_context.getProgramInfoLog(shaderProgram));
		var numUniforms = snow_modules_opengl_web_GL.current_context.getProgramParameter(shaderProgram,35718);
		var uniformLocations = new haxe_ds_StringMap();
		while(numUniforms-- > 0) {
			var uInfo = snow_modules_opengl_web_GL.current_context.getActiveUniform(shaderProgram,numUniforms);
			var loc = snow_modules_opengl_web_GL.current_context.getUniformLocation(shaderProgram,uInfo.name);
			var tmp;
			var key = uInfo.name;
			if(__map_reserved[key] != null) uniformLocations.setReserved(key,loc); else uniformLocations.h[key] = loc;
			tmp = loc;
			tmp;
		}
		var numAttributes = snow_modules_opengl_web_GL.current_context.getProgramParameter(shaderProgram,35721);
		var attributeLocations = new haxe_ds_StringMap();
		while(numAttributes-- > 0) {
			var aInfo = snow_modules_opengl_web_GL.current_context.getActiveAttrib(shaderProgram,numAttributes);
			var loc1 = snow_modules_opengl_web_GL.current_context.getAttribLocation(shaderProgram,aInfo.name);
			var tmp1;
			var key1 = aInfo.name;
			if(__map_reserved[key1] != null) attributeLocations.setReserved(key1,loc1); else attributeLocations.h[key1] = loc1;
			tmp1 = loc1;
			tmp1;
		}
		this._vert = vertexShader;
		this._frag = fragmentShader;
		this._prog = shaderProgram;
		var count = this._uniforms.length;
		var removeList = [];
		this._numTextures = 0;
		this._textures = [];
		var _g1 = 0;
		var _g11 = this._uniforms;
		while(_g1 < _g11.length) {
			var u = _g11[_g1];
			++_g1;
			var tmp2;
			var key2 = u.name;
			if(__map_reserved[key2] != null) tmp2 = uniformLocations.getReserved(key2); else tmp2 = uniformLocations.h[key2];
			var loc2 = tmp2;
			if(js_Boot.__instanceof(u,shaderblox_uniforms_UTexture)) {
				var t = u;
				t.samplerIndex = this._numTextures++;
				this._textures[t.samplerIndex] = t;
			}
			if(loc2 != null) u.location = loc2; else removeList.push(u);
		}
		while(removeList.length > 0) {
			var x = removeList.pop();
			HxOverrides.remove(this._uniforms,x);
		}
		var _g2 = 0;
		var _g12 = this._attributes;
		while(_g2 < _g12.length) {
			var a = _g12[_g2];
			++_g2;
			var tmp3;
			var key3 = a.name;
			if(__map_reserved[key3] != null) tmp3 = attributeLocations.getReserved(key3); else tmp3 = attributeLocations.h[key3];
			var loc3 = tmp3;
			a.location = loc3 == null?-1:loc3;
		}
	}
	,activate: function(initUniforms,initAttribs) {
		if(initAttribs == null) initAttribs = false;
		if(initUniforms == null) initUniforms = true;
		if(this._active) {
			if(initUniforms) {
				var _g = 0;
				var _g1 = this._uniforms;
				while(_g < _g1.length) {
					var u = _g1[_g];
					++_g;
					u.apply();
				}
			}
			if(initAttribs) {
				var offset = 0;
				var _g11 = 0;
				var _g2 = this._attributes.length;
				while(_g11 < _g2) {
					var i = _g11++;
					var att = this._attributes[i];
					var location = att.location;
					if(location != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,this._aStride,offset);
					}
					offset += att.byteSize;
				}
			}
			return;
		}
		if(!this._ready) this.create();
		snow_modules_opengl_web_GL.current_context.useProgram(this._prog);
		if(initUniforms) {
			var _g3 = 0;
			var _g12 = this._uniforms;
			while(_g3 < _g12.length) {
				var u1 = _g12[_g3];
				++_g3;
				u1.apply();
			}
		}
		if(initAttribs) {
			var offset1 = 0;
			var _g13 = 0;
			var _g4 = this._attributes.length;
			while(_g13 < _g4) {
				var i1 = _g13++;
				var att1 = this._attributes[i1];
				var location1 = att1.location;
				if(location1 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,this._aStride,offset1);
				}
				offset1 += att1.byteSize;
			}
		}
		this._active = true;
	}
	,deactivate: function() {
		if(!this._active) return;
		this._active = false;
		this.disableAttributes();
	}
	,disableAttributes: function() {
		var _g1 = 0;
		var _g = this._attributes.length;
		while(_g1 < _g) {
			var i = _g1++;
			var idx = this._attributes[i].location;
			if(idx == -1) continue;
			snow_modules_opengl_web_GL.current_context.disableVertexAttribArray(idx);
		}
	}
	,__class__: shaderblox_ShaderBase
};
var FluidBase = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["FluidBase"] = FluidBase;
FluidBase.__name__ = true;
FluidBase.__super__ = shaderblox_ShaderBase;
FluidBase.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UFloat("aspectRatio",null);
		this.aspectRatio = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec2("invresolution",null);
		this.invresolution = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance2;
		this._attributes.push(instance2);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n";
	}
	,__class__: FluidBase
});
var Advect = function() {
	FluidBase.call(this);
};
$hxClasses["Advect"] = Advect;
Advect.__name__ = true;
Advect.__super__ = FluidBase;
Advect.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("velocity",null,false);
		this.velocity = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UTexture("target",null,false);
		this.target = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("dt",null);
		this.dt = instance2;
		this._uniforms.push(instance2);
		var instance3 = new shaderblox_uniforms_UFloat("rdx",null);
		this.rdx = instance3;
		this._uniforms.push(instance3);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D velocity;\nuniform sampler2D target;\nuniform float dt;\nuniform float rdx; \n\nvarying vec2 texelCoord;\nvarying vec2 p;\n\nvoid main(void){\n  \n  \n  vec2 tracedPos = p - dt * rdx * sampleVelocity(velocity, texelCoord ).xy; \n\n  \n  \n  tracedPos = aspectToTexelSpace(tracedPos);\n  \n  tracedPos /= invresolution;\n  \n  vec4 st;\n  st.xy = floor(tracedPos-.5)+.5; \n  st.zw = st.xy+1.;               \n\n  vec2 t = tracedPos - st.xy;\n\n  st *= invresolution.xyxy; \n  \n  vec4 tex11 = texture2D(target, st.xy );\n  vec4 tex21 = texture2D(target, st.zy );\n  vec4 tex12 = texture2D(target, st.xw );\n  vec4 tex22 = texture2D(target, st.zw );\n\n  \n  gl_FragColor = mix(mix(tex11, tex21, t.x), mix(tex12, tex22, t.x), t.y);\n}\n";
	}
	,__class__: Advect
});
var AdvectVelocity = function() {
	FluidBase.call(this);
};
$hxClasses["AdvectVelocity"] = AdvectVelocity;
AdvectVelocity.__name__ = true;
AdvectVelocity.__super__ = FluidBase;
AdvectVelocity.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("velocity",null,false);
		this.velocity = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UFloat("dt",null);
		this.dt = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("rdx",null);
		this.rdx = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D velocity;\nuniform float dt;\nuniform float rdx; \n\nvarying vec2 texelCoord;\nvarying vec2 p;\n\nvoid main(void){\n  \n  \n  vec2 tracedPos = p - dt * rdx * sampleVelocity(velocity, texelCoord).xy; \n\n  \n  \n  tracedPos = aspectToTexelSpace(tracedPos);\n  \n  tracedPos /= invresolution;\n  \n  vec4 st;\n  st.xy = floor(tracedPos-.5)+.5; \n  st.zw = st.xy+1.;               \n\n  vec2 t = tracedPos - st.xy;\n\n  st *= invresolution.xyxy; \n  \n  vec2 tex11 = sampleVelocity(velocity, st.xy);\n  vec2 tex21 = sampleVelocity(velocity, st.zy);\n  vec2 tex12 = sampleVelocity(velocity, st.xw);\n  vec2 tex22 = sampleVelocity(velocity, st.zw);\n  \n  \n  gl_FragColor = packFluidVelocity(mix(mix(tex11, tex21, t.x), mix(tex12, tex22, t.x), t.y));\n}\n";
	}
	,__class__: AdvectVelocity
});
var Divergence = function() {
	FluidBase.call(this);
};
$hxClasses["Divergence"] = Divergence;
Divergence.__name__ = true;
Divergence.__super__ = FluidBase;
Divergence.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("velocity",null,false);
		this.velocity = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UFloat("halfrdx",null);
		this.halfrdx = instance1;
		this._uniforms.push(instance1);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D velocity;\t\nuniform float halfrdx;\t\n\r\nvarying vec2 texelCoord;\r\n\r\nvoid main(void){\r\n\t\n \t\n\tvec2 L = sampleVelocity(velocity, texelCoord - vec2(invresolution.x, 0));\r\n\tvec2 R = sampleVelocity(velocity, texelCoord + vec2(invresolution.x, 0));\r\n\tvec2 B = sampleVelocity(velocity, texelCoord - vec2(0, invresolution.y));\r\n\tvec2 T = sampleVelocity(velocity, texelCoord + vec2(0, invresolution.y));\r\n\r\n\tgl_FragColor = packFluidDivergence( halfrdx * ((R.x - L.x) + (T.y - B.y)));\r\n}\r\n\n";
	}
	,__class__: Divergence
});
var PressureSolve = function() {
	FluidBase.call(this);
};
$hxClasses["PressureSolve"] = PressureSolve;
PressureSolve.__name__ = true;
PressureSolve.__super__ = FluidBase;
PressureSolve.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("pressure",null,false);
		this.pressure = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UTexture("divergence",null,false);
		this.divergence = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("alpha",null);
		this.alpha = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D pressure;\nuniform sampler2D divergence;\nuniform float alpha;\n\nvarying vec2 texelCoord;\n\nvoid main(void){\n  \n  \n  float L = samplePressue(pressure, texelCoord - vec2(invresolution.x, 0));\n  float R = samplePressue(pressure, texelCoord + vec2(invresolution.x, 0));\n  float B = samplePressue(pressure, texelCoord - vec2(0, invresolution.y));\n  float T = samplePressue(pressure, texelCoord + vec2(0, invresolution.y));\n\n  float bC = sampleDivergence(divergence, texelCoord);\n\n  gl_FragColor = packFluidPressure((L + R + B + T + alpha * bC) * .25);\n}\n";
	}
	,__class__: PressureSolve
});
var PressureGradientSubstract = function() {
	FluidBase.call(this);
};
$hxClasses["PressureGradientSubstract"] = PressureGradientSubstract;
PressureGradientSubstract.__name__ = true;
PressureGradientSubstract.__super__ = FluidBase;
PressureGradientSubstract.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("pressure",null,false);
		this.pressure = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UTexture("velocity",null,false);
		this.velocity = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("halfrdx",null);
		this.halfrdx = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D pressure;\r\nuniform sampler2D velocity;\r\nuniform float halfrdx;\r\n\r\nvarying vec2 texelCoord;\r\n\r\nvoid main(void){\r\n  float L = samplePressue(pressure, texelCoord - vec2(invresolution.x, 0));\r\n  float R = samplePressue(pressure, texelCoord + vec2(invresolution.x, 0));\r\n  float B = samplePressue(pressure, texelCoord - vec2(0, invresolution.y));\r\n  float T = samplePressue(pressure, texelCoord + vec2(0, invresolution.y));\r\n\r\n  vec2 v = sampleVelocity(velocity, texelCoord);\r\n\r\n  gl_FragColor = packFluidVelocity(v - halfrdx*vec2(R-L, T-B));\r\n}\r\n\r\n\n";
	}
	,__class__: PressureGradientSubstract
});
var ApplyForces = function() {
	FluidBase.call(this);
};
$hxClasses["ApplyForces"] = ApplyForces;
ApplyForces.__name__ = true;
ApplyForces.__super__ = FluidBase;
ApplyForces.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("velocity",null,false);
		this.velocity = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UFloat("dt",null);
		this.dt = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("dx",null);
		this.dx = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D velocity;\n\tuniform float dt;\n\tuniform float dx;\n\tvarying vec2 texelCoord;\n\tvarying vec2 p;\n";
	}
	,__class__: ApplyForces
});
var UpdateDye = function() {
	FluidBase.call(this);
};
$hxClasses["UpdateDye"] = UpdateDye;
UpdateDye.__name__ = true;
UpdateDye.__super__ = FluidBase;
UpdateDye.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("dye",null,false);
		this.dye = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UFloat("dt",null);
		this.dt = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UFloat("dx",null);
		this.dx = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D dye;\n\tuniform float dt;\n\tuniform float dx;\n\tvarying vec2 texelCoord;\n\tvarying vec2 p;\n";
	}
	,__class__: UpdateDye
});
var ClearVelocity = function() {
	FluidBase.call(this);
};
$hxClasses["ClearVelocity"] = ClearVelocity;
ClearVelocity.__name__ = true;
ClearVelocity.__super__ = FluidBase;
ClearVelocity.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nvoid main(){\n\tgl_FragColor = packFluidVelocity(vec2(0));\n}\n";
	}
	,__class__: ClearVelocity
});
var ClearPressure = function() {
	FluidBase.call(this);
};
$hxClasses["ClearPressure"] = ClearPressure;
ClearPressure.__name__ = true;
ClearPressure.__super__ = FluidBase;
ClearPressure.prototype = $extend(FluidBase.prototype,{
	createProperties: function() {
		FluidBase.prototype.createProperties.call(this);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nvoid main(){\n\tgl_FragColor = packFluidPressure(0.0);\n}\n";
	}
	,__class__: ClearPressure
});
var GPUParticles = function(count) {
	this.textureQuad = gltoolbox_GeometryTools.getCachedUnitQuad();
	this.velocityStepShader = new VelocityStep();
	this.positionStepShader = new PositionStep();
	this.initialPositionShader = new InitialPosition();
	this.initialVelocityShader = new InitialVelocity();
	var _this = this.velocityStepShader.dragCoefficient;
	_this.dirty = true;
	_this.data = 1;
	this.velocityStepShader.flowScale.data.x = 1;
	this.velocityStepShader.flowScale.data.y = 1;
	this.setCount(count);
	var shader = this.initialPositionShader;
	var target = this.positionData;
	snow_modules_opengl_web_GL.current_context.viewport(0,0,target.width,target.height);
	snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target.writeFrameBufferObject);
	snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
	if(shader._active) {
		var _g = 0;
		var _g1 = shader._uniforms;
		while(_g < _g1.length) {
			var u = _g1[_g];
			++_g;
			u.apply();
		}
		var offset = 0;
		var _g11 = 0;
		var _g2 = shader._attributes.length;
		while(_g11 < _g2) {
			var i = _g11++;
			var att = shader._attributes[i];
			var location = att.location;
			if(location != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
			}
			offset += att.byteSize;
		}
	} else {
		if(!shader._ready) shader.create();
		snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
		var _g3 = 0;
		var _g12 = shader._uniforms;
		while(_g3 < _g12.length) {
			var u1 = _g12[_g3];
			++_g3;
			u1.apply();
		}
		var offset1 = 0;
		var _g13 = 0;
		var _g4 = shader._attributes.length;
		while(_g13 < _g4) {
			var i1 = _g13++;
			var att1 = shader._attributes[i1];
			var location1 = att1.location;
			if(location1 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
			}
			offset1 += att1.byteSize;
		}
		shader._active = true;
	}
	snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
	shader.deactivate();
	target.tmpFBO = target.writeFrameBufferObject;
	target.writeFrameBufferObject = target.readFrameBufferObject;
	target.readFrameBufferObject = target.tmpFBO;
	target.tmpTex = target.writeToTexture;
	target.writeToTexture = target.readFromTexture;
	target.readFromTexture = target.tmpTex;
	var shader1 = this.initialVelocityShader;
	var target1 = this.velocityData;
	snow_modules_opengl_web_GL.current_context.viewport(0,0,target1.width,target1.height);
	snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target1.writeFrameBufferObject);
	snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
	if(shader1._active) {
		var _g5 = 0;
		var _g14 = shader1._uniforms;
		while(_g5 < _g14.length) {
			var u2 = _g14[_g5];
			++_g5;
			u2.apply();
		}
		var offset2 = 0;
		var _g15 = 0;
		var _g6 = shader1._attributes.length;
		while(_g15 < _g6) {
			var i2 = _g15++;
			var att2 = shader1._attributes[i2];
			var location2 = att2.location;
			if(location2 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
			}
			offset2 += att2.byteSize;
		}
	} else {
		if(!shader1._ready) shader1.create();
		snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
		var _g7 = 0;
		var _g16 = shader1._uniforms;
		while(_g7 < _g16.length) {
			var u3 = _g16[_g7];
			++_g7;
			u3.apply();
		}
		var offset3 = 0;
		var _g17 = 0;
		var _g8 = shader1._attributes.length;
		while(_g17 < _g8) {
			var i3 = _g17++;
			var att3 = shader1._attributes[i3];
			var location3 = att3.location;
			if(location3 != -1) {
				snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
				snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
			}
			offset3 += att3.byteSize;
		}
		shader1._active = true;
	}
	snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
	shader1.deactivate();
	target1.tmpFBO = target1.writeFrameBufferObject;
	target1.writeFrameBufferObject = target1.readFrameBufferObject;
	target1.readFrameBufferObject = target1.tmpFBO;
	target1.tmpTex = target1.writeToTexture;
	target1.writeToTexture = target1.readFromTexture;
	target1.readFromTexture = target1.tmpTex;
};
$hxClasses["GPUParticles"] = GPUParticles;
GPUParticles.__name__ = true;
GPUParticles.prototype = {
	setCount: function(newCount) {
		var dataWidth = Math.ceil(Math.sqrt(newCount));
		if(this.positionData == null) this.positionData = new gltoolbox_render_RenderTarget2Phase(dataWidth,dataWidth,function(width,height) {
			return gltoolbox_TextureTools.createTexture(width,height,{ channelType : 6408, dataType : 5121, filter : 9728});
		}); else this.positionData.resize(dataWidth,dataWidth);
		if(this.velocityData == null) this.velocityData = new gltoolbox_render_RenderTarget2Phase(dataWidth,dataWidth,function(width1,height1) {
			return gltoolbox_TextureTools.createTexture(width1,height1,{ channelType : 6408, dataType : 5121, filter : 9728});
		}); else this.velocityData.resize(dataWidth,dataWidth);
		if(this.particleUVs != null) snow_modules_opengl_web_GL.current_context.deleteBuffer(this.particleUVs);
		this.particleUVs = snow_modules_opengl_web_GL.current_context.createBuffer();
		var tmp;
		var elements = dataWidth * dataWidth * 2;
		var this1;
		if(elements != null) this1 = new Float32Array(elements); else this1 = null;
		tmp = this1;
		var arrayUVs = tmp;
		var index;
		var _g = 0;
		while(_g < dataWidth) {
			var i = _g++;
			var _g1 = 0;
			while(_g1 < dataWidth) {
				var j = _g1++;
				index = (i * dataWidth + j) * 2;
				arrayUVs[index] = i / dataWidth;
				var idx = ++index;
				arrayUVs[idx] = j / dataWidth;
			}
		}
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.particleUVs);
		snow_modules_opengl_web_GL.current_context.bufferData(34962,arrayUVs,35044);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,null);
		var particleSpacing = 2 / dataWidth;
		var _this = this.initialPositionShader.jitterAmount;
		_this.dirty = true;
		_this.data = particleSpacing;
		return this.count = newCount;
	}
	,__class__: GPUParticles
};
var PlaneTexture = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["PlaneTexture"] = PlaneTexture;
PlaneTexture.__name__ = true;
PlaneTexture.__super__ = shaderblox_ShaderBase;
PlaneTexture.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance;
		this._attributes.push(instance);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n";
	}
	,__class__: PlaneTexture
});
var ParticleBase = function() {
	PlaneTexture.call(this);
};
$hxClasses["ParticleBase"] = ParticleBase;
ParticleBase.__name__ = true;
ParticleBase.__super__ = PlaneTexture;
ParticleBase.prototype = $extend(PlaneTexture.prototype,{
	createProperties: function() {
		PlaneTexture.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UFloat("dt",null);
		this.dt = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UTexture("positionData",null,false);
		this.positionData = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UTexture("velocityData",null,false);
		this.velocityData = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n\nuniform float dt;\n\tuniform sampler2D positionData;\n\tuniform sampler2D velocityData;\n";
	}
	,__class__: ParticleBase
});
var VelocityStep = function() {
	ParticleBase.call(this);
};
$hxClasses["VelocityStep"] = VelocityStep;
VelocityStep.__name__ = true;
VelocityStep.__super__ = ParticleBase;
VelocityStep.prototype = $extend(ParticleBase.prototype,{
	createProperties: function() {
		ParticleBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UFloat("dragCoefficient",null);
		this.dragCoefficient = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec2("flowScale",null);
		this.flowScale = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UTexture("flowVelocityField",null,false);
		this.flowVelocityField = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n\nuniform float dt;\n\tuniform sampler2D positionData;\n\tuniform sampler2D velocityData;\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\n\tuniform float dragCoefficient;\n\tuniform vec2 flowScale;\n\tuniform sampler2D flowVelocityField;\n\tvoid main(){\n\t\t\n\t\tvec2 p = unpackParticlePosition(texture2D(positionData, texelCoord));\n\t\tvec2 v = unpackParticleVelocity(texture2D(velocityData, texelCoord));\n\t\t\n\t\tvec2 vf = unpackFluidVelocity(texture2D(flowVelocityField, p*.5 + .5)) * flowScale;\n\t\t\n\t\tv += (vf - v) * dragCoefficient;\n\t\t\n\t\tgl_FragColor = packParticleVelocity(v);\n\t}\n";
	}
	,__class__: VelocityStep
});
var PositionStep = function() {
	ParticleBase.call(this);
};
$hxClasses["PositionStep"] = PositionStep;
PositionStep.__name__ = true;
PositionStep.__super__ = ParticleBase;
PositionStep.prototype = $extend(ParticleBase.prototype,{
	createProperties: function() {
		ParticleBase.prototype.createProperties.call(this);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n\nuniform float dt;\n\tuniform sampler2D positionData;\n\tuniform sampler2D velocityData;\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\n\tvoid main(){\n\t\t\n\t\tvec2 p = unpackParticlePosition(texture2D(positionData, texelCoord));\n\t\tvec2 v = unpackParticleVelocity(texture2D(velocityData, texelCoord));\n\t\t\n\t\tp += v * dt;\n\t\t\n\t\tgl_FragColor = packParticlePosition(p);\n\t}\n";
	}
	,__class__: PositionStep
});
var InitialPosition = function() {
	PlaneTexture.call(this);
};
$hxClasses["InitialPosition"] = InitialPosition;
InitialPosition.__name__ = true;
InitialPosition.__super__ = PlaneTexture;
InitialPosition.prototype = $extend(PlaneTexture.prototype,{
	createProperties: function() {
		PlaneTexture.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UFloat("jitterAmount",null);
		this.jitterAmount = instance;
		this._uniforms.push(instance);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\nfloat rand(vec2 co){\n\treturn fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\n\tuniform float jitterAmount;\n\tvoid main(){\n\t\tvec2 initialPosition = vec2(texelCoord.x, texelCoord.y) * 2.0 - 1.0;\n\t\t\n\t\tinitialPosition.x += rand(initialPosition)*jitterAmount;\n\t\tinitialPosition.y += rand(initialPosition + 0.3415)*jitterAmount;\n\t\tgl_FragColor = packParticlePosition(initialPosition);\n\t}\n";
	}
	,__class__: InitialPosition
});
var InitialVelocity = function() {
	PlaneTexture.call(this);
};
$hxClasses["InitialVelocity"] = InitialVelocity;
InitialVelocity.__name__ = true;
InitialVelocity.__super__ = PlaneTexture;
InitialVelocity.prototype = $extend(PlaneTexture.prototype,{
	createProperties: function() {
		PlaneTexture.prototype.createProperties.call(this);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n\t}\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec2 texelCoord;\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\n\t\n\tvoid main(){\n\t\tgl_FragColor = packParticleVelocity(vec2(0));\n\t}\n";
	}
	,__class__: InitialVelocity
});
var RenderParticles = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["RenderParticles"] = RenderParticles;
RenderParticles.__name__ = true;
RenderParticles.__super__ = shaderblox_ShaderBase;
RenderParticles.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("positionData",null,false);
		this.positionData = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UTexture("velocityData",null,false);
		this.velocityData = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_attributes_FloatAttribute("particleUV",0,2);
		this.particleUV = instance2;
		this._attributes.push(instance2);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\n\tuniform sampler2D positionData;\n\tuniform sampler2D velocityData;\n\tattribute vec2 particleUV;\n\tvarying vec4 color;\n\t\n\tvoid main(){\n\t\tvec2 p = unpackParticlePosition(texture2D(positionData, particleUV));\n\t\tvec2 v = unpackParticleVelocity(texture2D(velocityData, particleUV));\n\t\tgl_PointSize = 1.0;\n\t\tgl_Position = vec4(p, 0.0, 1.0);\n\t\tcolor = vec4(1.0, 1.0, 1.0, 1.0);\n\t}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec4 color;\n\tvoid main(){\n\t\tgl_FragColor = vec4(color);\n\t}\n";
	}
	,__class__: RenderParticles
});
var HxOverrides = function() { };
$hxClasses["HxOverrides"] = HxOverrides;
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var snow_App = function() {
	this.next_render = 0;
	this.next_tick = 0;
	this.cur_frame_start = 0.0;
	this.current_time = 0;
	this.last_frame_start = 0.0;
	this.delta_sim = 0.0166666666666666664;
	this.delta_time = 0.0166666666666666664;
	this.max_frame_time = 0.25;
	this.update_rate = 0;
	this.render_rate = -1;
	this.fixed_delta = 0;
	this.timescale = 1;
};
$hxClasses["snow.App"] = snow_App;
snow_App.__name__ = true;
snow_App.prototype = {
	config: function(config) {
		return config;
	}
	,ready: function() {
	}
	,update: function(dt) {
	}
	,ondestroy: function() {
	}
	,onevent: function(event) {
	}
	,ontickstart: function() {
	}
	,ontickend: function() {
	}
	,onkeydown: function(keycode,scancode,repeat,mod,timestamp,window_id) {
	}
	,onkeyup: function(keycode,scancode,repeat,mod,timestamp,window_id) {
	}
	,ontextinput: function(text,start,length,type,timestamp,window_id) {
	}
	,onmousedown: function(x,y,button,timestamp,window_id) {
	}
	,onmouseup: function(x,y,button,timestamp,window_id) {
	}
	,onmousewheel: function(x,y,timestamp,window_id) {
	}
	,onmousemove: function(x,y,xrel,yrel,timestamp,window_id) {
	}
	,ontouchdown: function(x,y,touch_id,timestamp) {
	}
	,ontouchup: function(x,y,touch_id,timestamp) {
	}
	,ontouchmove: function(x,y,dx,dy,touch_id,timestamp) {
	}
	,ongamepadaxis: function(gamepad,axis,value,timestamp) {
	}
	,ongamepaddown: function(gamepad,button,value,timestamp) {
	}
	,ongamepadup: function(gamepad,button,value,timestamp) {
	}
	,ongamepaddevice: function(gamepad,id,type,timestamp) {
	}
	,on_internal_init: function() {
		this.cur_frame_start = snow_Snow.core.timestamp();
		this.last_frame_start = this.cur_frame_start;
		this.current_time = 0;
		this.delta_time = 0.016;
	}
	,on_internal_update: function() {
		if(this.update_rate != 0) {
			if(snow_Snow.core.timestamp() < this.next_tick) return;
			this.next_tick = snow_Snow.core.timestamp() + this.update_rate;
		}
		this.cur_frame_start = snow_Snow.core.timestamp();
		this.delta_time = this.cur_frame_start - this.last_frame_start;
		this.last_frame_start = this.cur_frame_start;
		if(this.delta_time > this.max_frame_time) this.delta_time = this.max_frame_time;
		var used_delta = this.fixed_delta == 0?this.delta_time:this.fixed_delta;
		used_delta *= this.timescale;
		this.delta_sim = used_delta;
		this.current_time += used_delta;
		this.app.do_internal_update(used_delta);
	}
	,on_internal_render: function() {
		if(this.render_rate != 0) {
			if(this.render_rate < 0 || this.next_render < snow_Snow.core.timestamp()) {
				this.app.render();
				this.next_render += this.render_rate;
			}
		}
	}
	,__class__: snow_App
};
var Main = function() {
	this.rshiftDown = false;
	this.lshiftDown = false;
	this.qualityDirection = 0;
	this.dyeColor = new shaderblox_uniforms_Vector3();
	this.dyeColorHSB = new hxColorToolkit_spaces_HSB(180,100,100);
	this.hueCycleEnabled = true;
	this.renderFluidEnabled = true;
	this.renderParticlesEnabled = true;
	this.frameRegionLBRT = new shaderblox_uniforms_Vector4();
	this.lastMouseFluid = new shaderblox_uniforms_Vector2();
	this.lastMouse = new shaderblox_uniforms_Vector2();
	this.mouseFluid = new shaderblox_uniforms_Vector2();
	this.mouse = new shaderblox_uniforms_Vector2();
	this.lastMousePointKnown = false;
	this.mousePointKnown = false;
	this.isMouseDown = true;
	this.screenBuffer = null;
	this.textureQuad = null;
	snow_App.call(this);
	this.performanceMonitor = new PerformanceMonitor(35,null,2000);
	this.set_simulationQuality(SimulationQuality.Medium);
	this.performanceMonitor.fpsTooLowCallback = $bind(this,this.lowerQualityRequired);
	var urlParams = js_Web.getParams();
	if(__map_reserved.q != null?urlParams.existsReserved("q"):urlParams.h.hasOwnProperty("q")) {
		var q = StringTools.trim((__map_reserved.q != null?urlParams.getReserved("q"):urlParams.h["q"]).toLowerCase());
		var _g = 0;
		var _g1 = Type.allEnums(SimulationQuality);
		while(_g < _g1.length) {
			var e = _g1[_g];
			++_g;
			var name = e[0].toLowerCase();
			if(q == name) {
				this.set_simulationQuality(e);
				this.performanceMonitor.fpsTooLowCallback = null;
				break;
			}
		}
	}
	if(__map_reserved.iterations != null?urlParams.existsReserved("iterations"):urlParams.h.hasOwnProperty("iterations")) {
		var iterationsParam = Std.parseInt(__map_reserved.iterations != null?urlParams.getReserved("iterations"):urlParams.h["iterations"]);
		if(((iterationsParam | 0) === iterationsParam)) this.set_fluidIterations(iterationsParam);
	}
	window.updateFrameRegion = $bind(this,this.updateFrameRegion);
};
$hxClasses["Main"] = Main;
Main.__name__ = true;
Main.__super__ = snow_App;
Main.prototype = $extend(snow_App.prototype,{
	config: function(config) {
		config.web.no_context_menu = false;
		config.window.borderless = true;
		config.window.fullscreen = true;
		config.window.width = window.innerWidth;
		config.window.height = window.innerHeight;
		config.render.antialiasing = 0;
		return config;
	}
	,ready: function() {
		this.window = this.app.window;
		this.init();
		this.window.onevent = $bind(this,this.onWindowEvent);
		this.window.onrender = $bind(this,this.render);
	}
	,init: function() {
		snow_modules_opengl_web_GL.current_context.disable(2929);
		snow_modules_opengl_web_GL.current_context.disable(2884);
		snow_modules_opengl_web_GL.current_context.disable(3024);
		this.textureQuad = gltoolbox_GeometryTools.createQuad(0,0,1,1);
		var tmp;
		var params = { channelType : 6407, dataType : 5121, filter : this.offScreenFilter};
		tmp = function(width,height) {
			return gltoolbox_TextureTools.createTexture(width,height,params);
		};
		this.offScreenTarget = new gltoolbox_render_RenderTarget(Math.round(this.window.width * this.offScreenScale),Math.round(this.window.height * this.offScreenScale),tmp);
		this.blitTextureShader = new BlitTexture();
		this.debugBlitTextureShader = new DebugBlitTexture();
		this.renderFluidShader = new FluidRender();
		this.renderParticlesShader = new ColorParticleMotion();
		this.updateDyeShader = new MouseDye();
		this.mouseForceShader = new MouseForce();
		var _this = this.updateDyeShader.mouse;
		_this.dirty = true;
		_this.data = this.mouseFluid;
		var _this1 = this.updateDyeShader.lastMouse;
		_this1.dirty = true;
		_this1.data = this.lastMouseFluid;
		var _this2 = this.updateDyeShader.dyeColor;
		_this2.dirty = true;
		_this2.data = this.dyeColor;
		var _this3 = this.mouseForceShader.mouse;
		_this3.dirty = true;
		_this3.data = this.mouseFluid;
		var _this4 = this.mouseForceShader.lastMouse;
		_this4.dirty = true;
		_this4.data = this.lastMouseFluid;
		var _this5 = this.renderFluidShader.regionLBRT;
		_this5.dirty = true;
		_this5.data = this.frameRegionLBRT;
		var _this6 = this.blitTextureShader.regionLBRT;
		_this6.dirty = true;
		_this6.data = this.frameRegionLBRT;
		this.fluid = new GPUFluid(Math.round(this.window.width * this.fluidScale),Math.round(this.window.height * this.fluidScale),32,this.fluidIterations);
		var _this7 = this.fluid;
		_this7.updateDyeShader = this.updateDyeShader;
		var _this8 = _this7.updateDyeShader.dx;
		_this8.dirty = true;
		_this8.data = _this7.cellSize;
		var shader = _this7.updateDyeShader;
		if(shader == null) {
		} else {
			var _this9 = shader.aspectRatio;
			_this9.dirty = true;
			_this9.data = _this7.aspectRatio;
			shader.invresolution.data.x = 1 / _this7.width;
			shader.invresolution.data.y = 1 / _this7.height;
		}
		var _this10 = this.fluid;
		_this10.applyForcesShader = this.mouseForceShader;
		var _this11 = _this10.applyForcesShader.dx;
		_this11.dirty = true;
		_this11.data = _this10.cellSize;
		var shader1 = _this10.applyForcesShader;
		if(shader1 == null) {
		} else {
			var _this12 = shader1.aspectRatio;
			_this12.dirty = true;
			_this12.data = _this10.aspectRatio;
			shader1.invresolution.data.x = 1 / _this10.width;
			shader1.invresolution.data.y = 1 / _this10.height;
		}
		this.particles = new GPUParticles(this.particleCount);
		this.particles.velocityStepShader.flowScale.data.x = 1 / (this.fluid.cellSize * this.fluid.aspectRatio);
		this.particles.velocityStepShader.flowScale.data.y = 1 / this.fluid.cellSize;
		var _this13 = this.particles.velocityStepShader.dragCoefficient;
		_this13.dirty = true;
		_this13.data = 1;
		var _this14 = this.dyeColor;
		_this14.x = 1;
		_this14.y = 0;
		_this14.z = 0;
		this.updateFrameRegion();
		this.initTime = haxe_Timer.stamp();
		this.lastTime = this.initTime;
	}
	,update: function(dt) {
		this.time = haxe_Timer.stamp() - this.initTime;
		var _this = this.performanceMonitor;
		if(dt > 0) {
			var fps = 1 / dt;
			if(fps < _this.fpsIgnoreBounds[0] && fps > _this.fpsIgnoreBounds[1]) {
			} else {
				_this.fpsSample.add(fps);
				if(_this.fpsSample.sampleCount < _this.fpsSample.length) {
				} else {
					var now = haxe_Timer.stamp() * 1000;
					if(_this.fpsSample.average < _this.lowerBoundFPS) {
						if(_this.lowerBoundEnterTime == null) _this.lowerBoundEnterTime = now;
						if(now - _this.lowerBoundEnterTime >= _this.thresholdTime_ms && _this.fpsTooLowCallback != null) {
							_this.fpsTooLowCallback((_this.lowerBoundFPS - _this.fpsSample.average) / _this.lowerBoundFPS);
							_this.fpsSample.clear();
							_this.lowerBoundEnterTime = null;
						}
					} else if(_this.fpsSample.average > _this.upperBoundFPS) {
						if(_this.upperBoundEnterTime == null) _this.upperBoundEnterTime = now;
						if(now - _this.upperBoundEnterTime >= _this.thresholdTime_ms && _this.fpsTooHighCallback != null) {
							_this.fpsTooHighCallback((_this.fpsSample.average - _this.upperBoundFPS) / _this.upperBoundFPS);
							_this.fpsSample.clear();
							_this.upperBoundEnterTime = null;
						}
					} else {
						_this.lowerBoundEnterTime = null;
						_this.upperBoundEnterTime = null;
					}
				}
			}
		}
		var _this1 = this.updateDyeShader.isMouseDown;
		_this1.dirty = true;
		_this1.data = this.isMouseDown && this.lastMousePointKnown;
		var _this2 = this.mouseForceShader.isMouseDown;
		_this2.dirty = true;
		_this2.data = this.isMouseDown && this.lastMousePointKnown;
		this.fluid.step(0.016);
		var _this3 = this.particles.velocityStepShader.flowVelocityField;
		_this3.dirty = true;
		_this3.data = this.fluid.velocityRenderTarget.readFromTexture;
		if(this.renderParticlesEnabled) {
			var _this4 = this.particles;
			var _this5 = _this4.velocityStepShader.dt;
			_this5.dirty = true;
			_this5.data = 0.016;
			var _this6 = _this4.velocityStepShader.positionData;
			_this6.dirty = true;
			_this6.data = _this4.positionData.readFromTexture;
			var _this7 = _this4.velocityStepShader.velocityData;
			_this7.dirty = true;
			_this7.data = _this4.velocityData.readFromTexture;
			var shader = _this4.velocityStepShader;
			var target = _this4.velocityData;
			snow_modules_opengl_web_GL.current_context.viewport(0,0,target.width,target.height);
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target.writeFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this4.textureQuad);
			if(shader._active) {
				var _g = 0;
				var _g1 = shader._uniforms;
				while(_g < _g1.length) {
					var u = _g1[_g];
					++_g;
					u.apply();
				}
				var offset = 0;
				var _g11 = 0;
				var _g2 = shader._attributes.length;
				while(_g11 < _g2) {
					var i = _g11++;
					var att = shader._attributes[i];
					var location = att.location;
					if(location != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
					}
					offset += att.byteSize;
				}
			} else {
				if(!shader._ready) shader.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
				var _g3 = 0;
				var _g12 = shader._uniforms;
				while(_g3 < _g12.length) {
					var u1 = _g12[_g3];
					++_g3;
					u1.apply();
				}
				var offset1 = 0;
				var _g13 = 0;
				var _g4 = shader._attributes.length;
				while(_g13 < _g4) {
					var i1 = _g13++;
					var att1 = shader._attributes[i1];
					var location1 = att1.location;
					if(location1 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
					}
					offset1 += att1.byteSize;
				}
				shader._active = true;
			}
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader.deactivate();
			target.tmpFBO = target.writeFrameBufferObject;
			target.writeFrameBufferObject = target.readFrameBufferObject;
			target.readFrameBufferObject = target.tmpFBO;
			target.tmpTex = target.writeToTexture;
			target.writeToTexture = target.readFromTexture;
			target.readFromTexture = target.tmpTex;
			var _this8 = _this4.positionStepShader.dt;
			_this8.dirty = true;
			_this8.data = 0.016;
			var _this9 = _this4.positionStepShader.positionData;
			_this9.dirty = true;
			_this9.data = _this4.positionData.readFromTexture;
			var _this10 = _this4.positionStepShader.velocityData;
			_this10.dirty = true;
			_this10.data = _this4.velocityData.readFromTexture;
			var shader1 = _this4.positionStepShader;
			var target1 = _this4.positionData;
			snow_modules_opengl_web_GL.current_context.viewport(0,0,target1.width,target1.height);
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target1.writeFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this4.textureQuad);
			if(shader1._active) {
				var _g5 = 0;
				var _g14 = shader1._uniforms;
				while(_g5 < _g14.length) {
					var u2 = _g14[_g5];
					++_g5;
					u2.apply();
				}
				var offset2 = 0;
				var _g15 = 0;
				var _g6 = shader1._attributes.length;
				while(_g15 < _g6) {
					var i2 = _g15++;
					var att2 = shader1._attributes[i2];
					var location2 = att2.location;
					if(location2 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
					}
					offset2 += att2.byteSize;
				}
			} else {
				if(!shader1._ready) shader1.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
				var _g7 = 0;
				var _g16 = shader1._uniforms;
				while(_g7 < _g16.length) {
					var u3 = _g16[_g7];
					++_g7;
					u3.apply();
				}
				var offset3 = 0;
				var _g17 = 0;
				var _g8 = shader1._attributes.length;
				while(_g17 < _g8) {
					var i3 = _g17++;
					var att3 = shader1._attributes[i3];
					var location3 = att3.location;
					if(location3 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
					}
					offset3 += att3.byteSize;
				}
				shader1._active = true;
			}
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader1.deactivate();
			target1.tmpFBO = target1.writeFrameBufferObject;
			target1.writeFrameBufferObject = target1.readFrameBufferObject;
			target1.readFrameBufferObject = target1.tmpFBO;
			target1.tmpTex = target1.writeToTexture;
			target1.writeToTexture = target1.readFromTexture;
			target1.readFromTexture = target1.tmpTex;
		}
		if(this.hueCycleEnabled) {
			var _g9 = this.dyeColorHSB;
			_g9.set_hue(_g9.get_hue() + 1.2);
		}
		if(this.isMouseDown) {
			if(this.hueCycleEnabled) {
				var vx = (this.mouse.x - this.lastMouse.x) / (0.016 * this.window.width);
				var vy = (this.mouse.y - this.lastMouse.y) / (0.016 * this.window.height);
				var _g10 = this.dyeColorHSB;
				_g10.set_hue(_g10.get_hue() + Math.sqrt(vx * vx + vy * vy) * 0.5);
			}
			var rgb = this.dyeColorHSB.toRGB();
			var _this11 = this.dyeColor;
			var x = rgb.get_red() / 255;
			var y = rgb.get_green() / 255;
			var z = rgb.get_blue() / 255;
			_this11.x = x;
			_this11.y = y;
			_this11.z = z;
		}
		var _this12 = this.lastMouse;
		_this12.x = this.mouse.x;
		_this12.y = this.mouse.y;
		var _this13 = this.lastMouseFluid;
		_this13.x = (this.mouse.x / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this13.y = (this.window.height - this.mouse.y) / this.window.height * 2 - 1;
		this.lastMousePointKnown = this.mousePointKnown;
	}
	,render: function(w) {
		snow_modules_opengl_web_GL.current_context.viewport(0,0,this.offScreenTarget.width,this.offScreenTarget.height);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.offScreenTarget.frameBufferObject);
		snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
		snow_modules_opengl_web_GL.current_context.clear(16384);
		if(this.renderFluidEnabled) {
			var shader = this.renderFluidShader;
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
			var _this = shader.texture;
			_this.dirty = true;
			_this.data = this.fluid.dyeRenderTarget.readFromTexture;
			shader.activate(true,true);
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader.deactivate();
		}
		snow_modules_opengl_web_GL.current_context.viewport(0,0,this.window.width,this.window.height);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.screenBuffer);
		var shader1 = this.blitTextureShader;
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.textureQuad);
		var _this1 = shader1.texture;
		_this1.dirty = true;
		_this1.data = this.offScreenTarget.texture;
		shader1.activate(true,true);
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader1.deactivate();
		if(this.renderParticlesEnabled) {
			snow_modules_opengl_web_GL.current_context.enable(3042);
			snow_modules_opengl_web_GL.current_context.blendEquation(32774);
			snow_modules_opengl_web_GL.current_context.blendFunc(770,1);
			var _this2 = this.renderParticlesShader.dye;
			_this2.dirty = true;
			_this2.data = this.offScreenTarget.texture;
			var shader2 = this.renderParticlesShader;
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,this.particles.particleUVs);
			var _this3 = shader2.positionData;
			_this3.dirty = true;
			_this3.data = this.particles.positionData.readFromTexture;
			var _this4 = shader2.velocityData;
			_this4.dirty = true;
			_this4.data = this.particles.velocityData.readFromTexture;
			shader2.activate(true,true);
			snow_modules_opengl_web_GL.current_context.drawArrays(0,0,this.particles.count);
			shader2.deactivate();
			snow_modules_opengl_web_GL.current_context.disable(3042);
		}
	}
	,updateSimulationTextures: function() {
		var w;
		var h;
		w = Math.round(this.window.width * this.fluidScale);
		h = Math.round(this.window.height * this.fluidScale);
		if(w != this.fluid.width || h != this.fluid.height) {
			var _this = this.fluid;
			_this.velocityRenderTarget.resize(w,h);
			_this.pressureRenderTarget.resize(w,h);
			var _this1 = _this.divergenceRenderTarget;
			var newTexture = _this1.textureFactory(w,h);
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this1.frameBufferObject);
			snow_modules_opengl_web_GL.current_context.framebufferTexture2D(36160,36064,3553,newTexture,0);
			if(_this1.texture != null) {
				var resampler = gltoolbox_shaders_Resample.instance;
				var _this2 = resampler.texture;
				_this2.dirty = true;
				_this2.data = _this1.texture;
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this1.frameBufferObject);
				snow_modules_opengl_web_GL.current_context.viewport(0,0,w,h);
				snow_modules_opengl_web_GL.current_context.bindBuffer(34962,gltoolbox_render_RenderTarget.textureQuad);
				if(resampler._active) {
					var _g = 0;
					var _g1 = resampler._uniforms;
					while(_g < _g1.length) {
						var u = _g1[_g];
						++_g;
						u.apply();
					}
					var offset = 0;
					var _g11 = 0;
					var _g2 = resampler._attributes.length;
					while(_g11 < _g2) {
						var i = _g11++;
						var att = resampler._attributes[i];
						var location = att.location;
						if(location != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,resampler._aStride,offset);
						}
						offset += att.byteSize;
					}
				} else {
					if(!resampler._ready) resampler.create();
					snow_modules_opengl_web_GL.current_context.useProgram(resampler._prog);
					var _g3 = 0;
					var _g12 = resampler._uniforms;
					while(_g3 < _g12.length) {
						var u1 = _g12[_g3];
						++_g3;
						u1.apply();
					}
					var offset1 = 0;
					var _g13 = 0;
					var _g4 = resampler._attributes.length;
					while(_g13 < _g4) {
						var i1 = _g13++;
						var att1 = resampler._attributes[i1];
						var location1 = att1.location;
						if(location1 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,resampler._aStride,offset1);
						}
						offset1 += att1.byteSize;
					}
					resampler._active = true;
				}
				snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
				resampler.deactivate();
				snow_modules_opengl_web_GL.current_context.deleteTexture(_this1.texture);
			} else {
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this1.frameBufferObject);
				snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
				snow_modules_opengl_web_GL.current_context.clear(16384);
			}
			_this1.width = w;
			_this1.height = h;
			_this1.texture = newTexture;
			_this.dyeRenderTarget.resize(w,h);
			_this.width = w;
			_this.height = h;
			_this.aspectRatio = w / h;
			_this.updateAllCoreShaderUniforms();
		}
		w = Math.round(this.window.width * this.offScreenScale);
		h = Math.round(this.window.height * this.offScreenScale);
		if(w != this.offScreenTarget.width || h != this.offScreenTarget.height) {
			var _this3 = this.offScreenTarget;
			var newTexture1 = _this3.textureFactory(w,h);
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this3.frameBufferObject);
			snow_modules_opengl_web_GL.current_context.framebufferTexture2D(36160,36064,3553,newTexture1,0);
			if(_this3.texture != null) {
				var resampler1 = gltoolbox_shaders_Resample.instance;
				var _this4 = resampler1.texture;
				_this4.dirty = true;
				_this4.data = _this3.texture;
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this3.frameBufferObject);
				snow_modules_opengl_web_GL.current_context.viewport(0,0,w,h);
				snow_modules_opengl_web_GL.current_context.bindBuffer(34962,gltoolbox_render_RenderTarget.textureQuad);
				if(resampler1._active) {
					var _g5 = 0;
					var _g14 = resampler1._uniforms;
					while(_g5 < _g14.length) {
						var u2 = _g14[_g5];
						++_g5;
						u2.apply();
					}
					var offset2 = 0;
					var _g15 = 0;
					var _g6 = resampler1._attributes.length;
					while(_g15 < _g6) {
						var i2 = _g15++;
						var att2 = resampler1._attributes[i2];
						var location2 = att2.location;
						if(location2 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,resampler1._aStride,offset2);
						}
						offset2 += att2.byteSize;
					}
				} else {
					if(!resampler1._ready) resampler1.create();
					snow_modules_opengl_web_GL.current_context.useProgram(resampler1._prog);
					var _g7 = 0;
					var _g16 = resampler1._uniforms;
					while(_g7 < _g16.length) {
						var u3 = _g16[_g7];
						++_g7;
						u3.apply();
					}
					var offset3 = 0;
					var _g17 = 0;
					var _g8 = resampler1._attributes.length;
					while(_g17 < _g8) {
						var i3 = _g17++;
						var att3 = resampler1._attributes[i3];
						var location3 = att3.location;
						if(location3 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,resampler1._aStride,offset3);
						}
						offset3 += att3.byteSize;
					}
					resampler1._active = true;
				}
				snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
				resampler1.deactivate();
				snow_modules_opengl_web_GL.current_context.deleteTexture(_this3.texture);
			} else {
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this3.frameBufferObject);
				snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
				snow_modules_opengl_web_GL.current_context.clear(16384);
			}
			_this3.width = w;
			_this3.height = h;
			_this3.texture = newTexture1;
		}
		if(this.particleCount != this.particles.count) this.particles.setCount(this.particleCount);
		this.particles.velocityStepShader.flowScale.data.x = 1 / (this.fluid.cellSize * this.fluid.aspectRatio);
		this.particles.velocityStepShader.flowScale.data.y = 1 / this.fluid.cellSize;
		var _this5 = this.particles.velocityStepShader.dragCoefficient;
		_this5.dirty = true;
		_this5.data = 1;
	}
	,set_simulationQuality: function(quality) {
		switch(quality[1]) {
		case 0:
			this.particleCount = 1048576;
			this.fluidScale = 0.5;
			this.set_fluidIterations(30);
			this.offScreenScale = 1.;
			this.offScreenFilter = 9728;
			break;
		case 1:
			this.particleCount = 1048576;
			this.fluidScale = 0.25;
			this.set_fluidIterations(20);
			this.offScreenScale = 1.;
			this.offScreenFilter = 9728;
			break;
		case 2:
			this.particleCount = 262144;
			this.fluidScale = 0.25;
			this.set_fluidIterations(18);
			this.offScreenScale = 1.;
			this.offScreenFilter = 9728;
			break;
		case 3:
			this.particleCount = 65536;
			this.fluidScale = 0.2;
			this.set_fluidIterations(14);
			this.offScreenScale = 1.;
			this.offScreenFilter = 9728;
			break;
		case 4:
			this.particleCount = 16384;
			this.fluidScale = 0.166666666666666657;
			this.set_fluidIterations(12);
			this.offScreenScale = 0.5;
			this.offScreenFilter = 9728;
			break;
		case 5:
			this.particleCount = 16384;
			this.fluidScale = 0.1;
			this.set_fluidIterations(6);
			this.offScreenScale = 0.5;
			this.offScreenFilter = 9729;
			break;
		}
		return this.simulationQuality = quality;
	}
	,set_fluidIterations: function(v) {
		this.fluidIterations = v;
		if(this.fluid != null) this.fluid.solverIterations = v;
		return v;
	}
	,lowerQualityRequired: function(magnitude) {
		if(this.qualityDirection > 0) return;
		this.qualityDirection = -1;
		var qualityIndex = this.simulationQuality[1];
		var maxIndex = Type.allEnums(SimulationQuality).length - 1;
		if(qualityIndex >= maxIndex) return;
		if(magnitude < 0.5) qualityIndex += 1; else qualityIndex += 2;
		if(qualityIndex > maxIndex) qualityIndex = maxIndex;
		var newQuality = Type.createEnumIndex(SimulationQuality,qualityIndex);
		this.set_simulationQuality(newQuality);
		this.updateSimulationTextures();
	}
	,updateFrameRegion: function() {
		var frameEl = window.document.getElementById(where);
		var _this = this.frameRegionLBRT;
		_this.x = frameEl.offsetLeft / this.window.width;
		_this.y = 1 - (frameEl.offsetTop + frameEl.offsetHeight) / this.window.height;
		_this.z = (frameEl.offsetLeft + frameEl.offsetWidth) / this.window.width;
		_this.w = 1 - frameEl.offsetTop / this.window.height;
	}
	,reset: function() {
		var _this = this.particles;
		var shader = _this.initialPositionShader;
		var target = _this.positionData;
		snow_modules_opengl_web_GL.current_context.viewport(0,0,target.width,target.height);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target.writeFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this.textureQuad);
		if(shader._active) {
			var _g = 0;
			var _g1 = shader._uniforms;
			while(_g < _g1.length) {
				var u = _g1[_g];
				++_g;
				u.apply();
			}
			var offset = 0;
			var _g11 = 0;
			var _g2 = shader._attributes.length;
			while(_g11 < _g2) {
				var i = _g11++;
				var att = shader._attributes[i];
				var location = att.location;
				if(location != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
				}
				offset += att.byteSize;
			}
		} else {
			if(!shader._ready) shader.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
			var _g3 = 0;
			var _g12 = shader._uniforms;
			while(_g3 < _g12.length) {
				var u1 = _g12[_g3];
				++_g3;
				u1.apply();
			}
			var offset1 = 0;
			var _g13 = 0;
			var _g4 = shader._attributes.length;
			while(_g13 < _g4) {
				var i1 = _g13++;
				var att1 = shader._attributes[i1];
				var location1 = att1.location;
				if(location1 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
				}
				offset1 += att1.byteSize;
			}
			shader._active = true;
		}
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader.deactivate();
		target.tmpFBO = target.writeFrameBufferObject;
		target.writeFrameBufferObject = target.readFrameBufferObject;
		target.readFrameBufferObject = target.tmpFBO;
		target.tmpTex = target.writeToTexture;
		target.writeToTexture = target.readFromTexture;
		target.readFromTexture = target.tmpTex;
		var shader1 = _this.initialVelocityShader;
		var target1 = _this.velocityData;
		snow_modules_opengl_web_GL.current_context.viewport(0,0,target1.width,target1.height);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target1.writeFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this.textureQuad);
		if(shader1._active) {
			var _g5 = 0;
			var _g14 = shader1._uniforms;
			while(_g5 < _g14.length) {
				var u2 = _g14[_g5];
				++_g5;
				u2.apply();
			}
			var offset2 = 0;
			var _g15 = 0;
			var _g6 = shader1._attributes.length;
			while(_g15 < _g6) {
				var i2 = _g15++;
				var att2 = shader1._attributes[i2];
				var location2 = att2.location;
				if(location2 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
				}
				offset2 += att2.byteSize;
			}
		} else {
			if(!shader1._ready) shader1.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
			var _g7 = 0;
			var _g16 = shader1._uniforms;
			while(_g7 < _g16.length) {
				var u3 = _g16[_g7];
				++_g7;
				u3.apply();
			}
			var offset3 = 0;
			var _g17 = 0;
			var _g8 = shader1._attributes.length;
			while(_g17 < _g8) {
				var i3 = _g17++;
				var att3 = shader1._attributes[i3];
				var location3 = att3.location;
				if(location3 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
				}
				offset3 += att3.byteSize;
			}
			shader1._active = true;
		}
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader1.deactivate();
		target1.tmpFBO = target1.writeFrameBufferObject;
		target1.writeFrameBufferObject = target1.readFrameBufferObject;
		target1.readFrameBufferObject = target1.tmpFBO;
		target1.tmpTex = target1.writeToTexture;
		target1.writeToTexture = target1.readFromTexture;
		target1.readFromTexture = target1.tmpTex;
		var _this1 = this.fluid;
		snow_modules_opengl_web_GL.current_context.viewport(0,0,_this1.width,_this1.height);
		snow_modules_opengl_web_GL.current_context.disable(3042);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this1.textureQuad);
		var shader2 = _this1.clearVelocityShader;
		if(shader2._active) {
			var _g9 = 0;
			var _g18 = shader2._uniforms;
			while(_g9 < _g18.length) {
				var u4 = _g18[_g9];
				++_g9;
				u4.apply();
			}
			var offset4 = 0;
			var _g19 = 0;
			var _g10 = shader2._attributes.length;
			while(_g19 < _g10) {
				var i4 = _g19++;
				var att4 = shader2._attributes[i4];
				var location4 = att4.location;
				if(location4 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location4);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location4,att4.itemCount,att4.type,false,shader2._aStride,offset4);
				}
				offset4 += att4.byteSize;
			}
		} else {
			if(!shader2._ready) shader2.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader2._prog);
			var _g20 = 0;
			var _g110 = shader2._uniforms;
			while(_g20 < _g110.length) {
				var u5 = _g110[_g20];
				++_g20;
				u5.apply();
			}
			var offset5 = 0;
			var _g111 = 0;
			var _g21 = shader2._attributes.length;
			while(_g111 < _g21) {
				var i5 = _g111++;
				var att5 = shader2._attributes[i5];
				var location5 = att5.location;
				if(location5 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location5);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location5,att5.itemCount,att5.type,false,shader2._aStride,offset5);
				}
				offset5 += att5.byteSize;
			}
			shader2._active = true;
		}
		_this1.velocityRenderTarget.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader2.deactivate();
		var _this2 = _this1.velocityRenderTarget;
		_this2.tmpFBO = _this2.writeFrameBufferObject;
		_this2.writeFrameBufferObject = _this2.readFrameBufferObject;
		_this2.readFrameBufferObject = _this2.tmpFBO;
		_this2.tmpTex = _this2.writeToTexture;
		_this2.writeToTexture = _this2.readFromTexture;
		_this2.readFromTexture = _this2.tmpTex;
		var shader3 = _this1.clearPressureShader;
		if(shader3._active) {
			var _g22 = 0;
			var _g112 = shader3._uniforms;
			while(_g22 < _g112.length) {
				var u6 = _g112[_g22];
				++_g22;
				u6.apply();
			}
			var offset6 = 0;
			var _g113 = 0;
			var _g23 = shader3._attributes.length;
			while(_g113 < _g23) {
				var i6 = _g113++;
				var att6 = shader3._attributes[i6];
				var location6 = att6.location;
				if(location6 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location6);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location6,att6.itemCount,att6.type,false,shader3._aStride,offset6);
				}
				offset6 += att6.byteSize;
			}
		} else {
			if(!shader3._ready) shader3.create();
			snow_modules_opengl_web_GL.current_context.useProgram(shader3._prog);
			var _g24 = 0;
			var _g114 = shader3._uniforms;
			while(_g24 < _g114.length) {
				var u7 = _g114[_g24];
				++_g24;
				u7.apply();
			}
			var offset7 = 0;
			var _g115 = 0;
			var _g25 = shader3._attributes.length;
			while(_g115 < _g25) {
				var i7 = _g115++;
				var att7 = shader3._attributes[i7];
				var location7 = att7.location;
				if(location7 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location7);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location7,att7.itemCount,att7.type,false,shader3._aStride,offset7);
				}
				offset7 += att7.byteSize;
			}
			shader3._active = true;
		}
		_this1.pressureRenderTarget.activate();
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		shader3.deactivate();
		var _this3 = _this1.pressureRenderTarget;
		_this3.tmpFBO = _this3.writeFrameBufferObject;
		_this3.writeFrameBufferObject = _this3.readFrameBufferObject;
		_this3.readFrameBufferObject = _this3.tmpFBO;
		_this3.tmpTex = _this3.writeToTexture;
		_this3.writeToTexture = _this3.readFromTexture;
		_this3.readFromTexture = _this3.tmpTex;
		var _this4 = _this1.dyeRenderTarget;
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this4.readFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
		snow_modules_opengl_web_GL.current_context.clear(16384);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this4.writeFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
		snow_modules_opengl_web_GL.current_context.clear(16384);
	}
	,onmousedown: function(x,y,button,_,_1) {
		this.isMouseDown = true;
		this.hueCycleEnabled = true;
	}
	,onmouseup: function(x,y,button,_,_1) {
	}
	,onmousemove: function(x,y,xrel,yrel,_,_1) {
		var _this = this.mouse;
		_this.x = x;
		_this.y = y;
		var _this1 = this.mouseFluid;
		_this1.x = (x / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this1.y = (this.window.height - y) / this.window.height * 2 - 1;
		this.mousePointKnown = true;
	}
	,ontouchdown: function(x,y,touch_id,_) {
		var x1 = x;
		var y1 = y;
		x1 = x * this.window.width;
		y1 = y * this.window.height;
		var _this = this.mouse;
		_this.x = x1;
		_this.y = y1;
		var _this1 = this.mouseFluid;
		_this1.x = (x1 / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this1.y = (this.window.height - y1) / this.window.height * 2 - 1;
		this.mousePointKnown = true;
		var _this2 = this.lastMouse;
		_this2.x = this.mouse.x;
		_this2.y = this.mouse.y;
		var _this3 = this.lastMouseFluid;
		_this3.x = (this.mouse.x / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this3.y = (this.window.height - this.mouse.y) / this.window.height * 2 - 1;
		this.lastMousePointKnown = this.mousePointKnown;
		this.isMouseDown = true;
		this.hueCycleEnabled = true;
	}
	,ontouchup: function(x,y,touch_id,_) {
		var x1 = x;
		var y1 = y;
		x1 = x * this.window.width;
		y1 = y * this.window.height;
		var _this = this.mouse;
		_this.x = x1;
		_this.y = y1;
		var _this1 = this.mouseFluid;
		_this1.x = (x1 / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this1.y = (this.window.height - y1) / this.window.height * 2 - 1;
		this.mousePointKnown = true;
		this.isMouseDown = false;
	}
	,ontouchmove: function(x,y,dx,dy,touch_id,_) {
		var x1 = x;
		var y1 = y;
		x1 = x * this.window.width;
		y1 = y * this.window.height;
		var _this = this.mouse;
		_this.x = x1;
		_this.y = y1;
		var _this1 = this.mouseFluid;
		_this1.x = (x1 / this.window.width * 2 - 1) * this.fluid.aspectRatio;
		_this1.y = (this.window.height - y1) / this.window.height * 2 - 1;
		this.mousePointKnown = true;
	}
	,onkeydown: function(keyCode,_,_1,_2,_3,_4) {
		switch(keyCode) {
		case snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lshift):
			this.lshiftDown = true;
			break;
		case snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.rshift):
			this.rshiftDown = true;
			break;
		}
	}
	,onkeyup: function(keyCode,_,_1,_2,_3,_4) {
		switch(keyCode) {
		case 114:
			if(this.lshiftDown || this.rshiftDown) {
				var _this = this.particles;
				var shader = _this.initialPositionShader;
				var target = _this.positionData;
				snow_modules_opengl_web_GL.current_context.viewport(0,0,target.width,target.height);
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target.writeFrameBufferObject);
				snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this.textureQuad);
				if(shader._active) {
					var _g = 0;
					var _g1 = shader._uniforms;
					while(_g < _g1.length) {
						var u = _g1[_g];
						++_g;
						u.apply();
					}
					var offset = 0;
					var _g11 = 0;
					var _g2 = shader._attributes.length;
					while(_g11 < _g2) {
						var i = _g11++;
						var att = shader._attributes[i];
						var location = att.location;
						if(location != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,shader._aStride,offset);
						}
						offset += att.byteSize;
					}
				} else {
					if(!shader._ready) shader.create();
					snow_modules_opengl_web_GL.current_context.useProgram(shader._prog);
					var _g3 = 0;
					var _g12 = shader._uniforms;
					while(_g3 < _g12.length) {
						var u1 = _g12[_g3];
						++_g3;
						u1.apply();
					}
					var offset1 = 0;
					var _g13 = 0;
					var _g4 = shader._attributes.length;
					while(_g13 < _g4) {
						var i1 = _g13++;
						var att1 = shader._attributes[i1];
						var location1 = att1.location;
						if(location1 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,shader._aStride,offset1);
						}
						offset1 += att1.byteSize;
					}
					shader._active = true;
				}
				snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
				shader.deactivate();
				target.tmpFBO = target.writeFrameBufferObject;
				target.writeFrameBufferObject = target.readFrameBufferObject;
				target.readFrameBufferObject = target.tmpFBO;
				target.tmpTex = target.writeToTexture;
				target.writeToTexture = target.readFromTexture;
				target.readFromTexture = target.tmpTex;
				var shader1 = _this.initialVelocityShader;
				var target1 = _this.velocityData;
				snow_modules_opengl_web_GL.current_context.viewport(0,0,target1.width,target1.height);
				snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,target1.writeFrameBufferObject);
				snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this.textureQuad);
				if(shader1._active) {
					var _g5 = 0;
					var _g14 = shader1._uniforms;
					while(_g5 < _g14.length) {
						var u2 = _g14[_g5];
						++_g5;
						u2.apply();
					}
					var offset2 = 0;
					var _g15 = 0;
					var _g6 = shader1._attributes.length;
					while(_g15 < _g6) {
						var i2 = _g15++;
						var att2 = shader1._attributes[i2];
						var location2 = att2.location;
						if(location2 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location2);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location2,att2.itemCount,att2.type,false,shader1._aStride,offset2);
						}
						offset2 += att2.byteSize;
					}
				} else {
					if(!shader1._ready) shader1.create();
					snow_modules_opengl_web_GL.current_context.useProgram(shader1._prog);
					var _g7 = 0;
					var _g16 = shader1._uniforms;
					while(_g7 < _g16.length) {
						var u3 = _g16[_g7];
						++_g7;
						u3.apply();
					}
					var offset3 = 0;
					var _g17 = 0;
					var _g8 = shader1._attributes.length;
					while(_g17 < _g8) {
						var i3 = _g17++;
						var att3 = shader1._attributes[i3];
						var location3 = att3.location;
						if(location3 != -1) {
							snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location3);
							snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location3,att3.itemCount,att3.type,false,shader1._aStride,offset3);
						}
						offset3 += att3.byteSize;
					}
					shader1._active = true;
				}
				snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
				shader1.deactivate();
				target1.tmpFBO = target1.writeFrameBufferObject;
				target1.writeFrameBufferObject = target1.readFrameBufferObject;
				target1.readFrameBufferObject = target1.tmpFBO;
				target1.tmpTex = target1.writeToTexture;
				target1.writeToTexture = target1.readFromTexture;
				target1.readFromTexture = target1.tmpTex;
			} else this.reset();
			break;
		case 112:
			this.renderParticlesEnabled = !this.renderParticlesEnabled;
			break;
		case 100:
			this.renderFluidEnabled = !this.renderFluidEnabled;
			break;
		case 115:
			var _this1 = this.fluid;
			snow_modules_opengl_web_GL.current_context.viewport(0,0,_this1.width,_this1.height);
			snow_modules_opengl_web_GL.current_context.disable(3042);
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,_this1.textureQuad);
			var shader2 = _this1.clearVelocityShader;
			if(shader2._active) {
				var _g9 = 0;
				var _g18 = shader2._uniforms;
				while(_g9 < _g18.length) {
					var u4 = _g18[_g9];
					++_g9;
					u4.apply();
				}
				var offset4 = 0;
				var _g19 = 0;
				var _g10 = shader2._attributes.length;
				while(_g19 < _g10) {
					var i4 = _g19++;
					var att4 = shader2._attributes[i4];
					var location4 = att4.location;
					if(location4 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location4);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location4,att4.itemCount,att4.type,false,shader2._aStride,offset4);
					}
					offset4 += att4.byteSize;
				}
			} else {
				if(!shader2._ready) shader2.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader2._prog);
				var _g20 = 0;
				var _g110 = shader2._uniforms;
				while(_g20 < _g110.length) {
					var u5 = _g110[_g20];
					++_g20;
					u5.apply();
				}
				var offset5 = 0;
				var _g111 = 0;
				var _g21 = shader2._attributes.length;
				while(_g111 < _g21) {
					var i5 = _g111++;
					var att5 = shader2._attributes[i5];
					var location5 = att5.location;
					if(location5 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location5);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location5,att5.itemCount,att5.type,false,shader2._aStride,offset5);
					}
					offset5 += att5.byteSize;
				}
				shader2._active = true;
			}
			_this1.velocityRenderTarget.activate();
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader2.deactivate();
			var _this2 = _this1.velocityRenderTarget;
			_this2.tmpFBO = _this2.writeFrameBufferObject;
			_this2.writeFrameBufferObject = _this2.readFrameBufferObject;
			_this2.readFrameBufferObject = _this2.tmpFBO;
			_this2.tmpTex = _this2.writeToTexture;
			_this2.writeToTexture = _this2.readFromTexture;
			_this2.readFromTexture = _this2.tmpTex;
			var shader3 = _this1.clearPressureShader;
			if(shader3._active) {
				var _g22 = 0;
				var _g112 = shader3._uniforms;
				while(_g22 < _g112.length) {
					var u6 = _g112[_g22];
					++_g22;
					u6.apply();
				}
				var offset6 = 0;
				var _g113 = 0;
				var _g23 = shader3._attributes.length;
				while(_g113 < _g23) {
					var i6 = _g113++;
					var att6 = shader3._attributes[i6];
					var location6 = att6.location;
					if(location6 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location6);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location6,att6.itemCount,att6.type,false,shader3._aStride,offset6);
					}
					offset6 += att6.byteSize;
				}
			} else {
				if(!shader3._ready) shader3.create();
				snow_modules_opengl_web_GL.current_context.useProgram(shader3._prog);
				var _g24 = 0;
				var _g114 = shader3._uniforms;
				while(_g24 < _g114.length) {
					var u7 = _g114[_g24];
					++_g24;
					u7.apply();
				}
				var offset7 = 0;
				var _g115 = 0;
				var _g25 = shader3._attributes.length;
				while(_g115 < _g25) {
					var i7 = _g115++;
					var att7 = shader3._attributes[i7];
					var location7 = att7.location;
					if(location7 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location7);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location7,att7.itemCount,att7.type,false,shader3._aStride,offset7);
					}
					offset7 += att7.byteSize;
				}
				shader3._active = true;
			}
			_this1.pressureRenderTarget.activate();
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			shader3.deactivate();
			var _this3 = _this1.pressureRenderTarget;
			_this3.tmpFBO = _this3.writeFrameBufferObject;
			_this3.writeFrameBufferObject = _this3.readFrameBufferObject;
			_this3.readFrameBufferObject = _this3.tmpFBO;
			_this3.tmpTex = _this3.writeToTexture;
			_this3.writeToTexture = _this3.readFromTexture;
			_this3.readFromTexture = _this3.tmpTex;
			var _this4 = _this1.dyeRenderTarget;
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this4.readFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
			snow_modules_opengl_web_GL.current_context.clear(16384);
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,_this4.writeFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
			snow_modules_opengl_web_GL.current_context.clear(16384);
			break;
		case snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lshift):
			this.lshiftDown = false;
			break;
		case snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.rshift):
			this.rshiftDown = false;
			break;
		}
	}
	,onWindowEvent: function(e) {
		var _g = e.type;
		if(_g != null) switch(_g) {
		case 6:
			this.updateFrameRegion();
			this.updateSimulationTextures();
			this.lastMousePointKnown = false;
			this.mousePointKnown = false;
			break;
		case 12:
			this.isMouseDown = false;
			break;
		case 11:
			this.mousePointKnown = false;
			this.lastMousePointKnown = false;
			this.isMouseDown = true;
			break;
		default:
		} else {
		}
	}
	,__class__: Main
});
var SimulationQuality = $hxClasses["SimulationQuality"] = { __ename__ : true, __constructs__ : ["UltraHigh","High","Medium","Low","UltraLow","iOS"] };
SimulationQuality.UltraHigh = ["UltraHigh",0];
SimulationQuality.UltraHigh.toString = $estr;
SimulationQuality.UltraHigh.__enum__ = SimulationQuality;
SimulationQuality.High = ["High",1];
SimulationQuality.High.toString = $estr;
SimulationQuality.High.__enum__ = SimulationQuality;
SimulationQuality.Medium = ["Medium",2];
SimulationQuality.Medium.toString = $estr;
SimulationQuality.Medium.__enum__ = SimulationQuality;
SimulationQuality.Low = ["Low",3];
SimulationQuality.Low.toString = $estr;
SimulationQuality.Low.__enum__ = SimulationQuality;
SimulationQuality.UltraLow = ["UltraLow",4];
SimulationQuality.UltraLow.toString = $estr;
SimulationQuality.UltraLow.__enum__ = SimulationQuality;
SimulationQuality.iOS = ["iOS",5];
SimulationQuality.iOS.toString = $estr;
SimulationQuality.iOS.__enum__ = SimulationQuality;
SimulationQuality.__empty_constructs__ = [SimulationQuality.UltraHigh,SimulationQuality.High,SimulationQuality.Medium,SimulationQuality.Low,SimulationQuality.UltraLow,SimulationQuality.iOS];
var BlitTexture = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["BlitTexture"] = BlitTexture;
BlitTexture.__name__ = true;
BlitTexture.__super__ = shaderblox_ShaderBase;
BlitTexture.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("texture",null,false);
		this.texture = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec4("regionLBRT",null);
		this.regionLBRT = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance2;
		this._attributes.push(instance2);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\nvarying vec2 texelCoord;\n\nvoid main() {\n\ttexelCoord = vertexPosition;\n\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nuniform sampler2D texture;\n\tuniform vec4 regionLBRT;\n\tvarying vec2 texelCoord;\n\tfloat inRegion(in vec2 origin, in vec2 end, in vec2 p){\n\t\tvec2 iv = step(origin, p) * (1.0 - step(end, p));\n\t\treturn iv.x*iv.y;\n\t}\n\tvoid main(void){\n\t\tvec2 o = regionLBRT.xy;\n\t\tvec2 e = regionLBRT.zw;\n\t\tvec2 center = (o+e)*.5;\n\t\tfloat inRegion = inRegion(o, e, texelCoord);\n\t\tfloat outRegion = 1.0 - inRegion;\n\t\t\n\t\tvec3 c = texture2D(texture, texelCoord).rgb;\n\t\t\n\t\t\n\t\tconst float dContrastOut = -0.0;\n\t\tconst float dBrightnessOut  = 0.04;\n\t\tconst float dContrastIn = 0.0;\n\t\tconst float dBrightnessIn = 0.0;\n\t\tc = (c - 0.5)*(1.0 + dContrastIn * inRegion + dContrastOut*outRegion) + 0.5 + dBrightnessIn*inRegion + dBrightnessOut*outRegion;\n\t\t\n\t\tc += max((0.5 - distance(texelCoord, center)) * vec3(0.3), 0.0) * outRegion;\n\t\tgl_FragColor = vec4(c, 1.0);\n\t}\n";
	}
	,__class__: BlitTexture
});
var FluidRender = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["FluidRender"] = FluidRender;
FluidRender.__name__ = true;
FluidRender.__super__ = shaderblox_ShaderBase;
FluidRender.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("texture",null,false);
		this.texture = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec4("regionLBRT",null);
		this.regionLBRT = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance2;
		this._attributes.push(instance2);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\nvarying vec2 texelCoord;\n\nvoid main() {\n\ttexelCoord = vertexPosition;\n\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nuniform sampler2D texture;\n\tuniform vec4 regionLBRT;\n\tvarying vec2 texelCoord;\n\tfloat inRegion(in vec2 origin, in vec2 end, in vec2 p){\n\t\tvec2 iv = step(origin, p) * (1.0 - step(end, p));\n\t\treturn iv.x*iv.y;\n\t}\n\tvec3 saturation(in vec3 rgb, in float amount){\n\t\tconst vec3 CW = vec3(0.299, 0.587, 0.114);\n\t\tvec3 bw = vec3(dot(rgb, CW));\n\t\treturn mix(bw, rgb, amount);\n\t}\n\tvoid main(void){\n\t\tvec2 o = regionLBRT.xy;\n\t\tvec2 e = regionLBRT.zw;\n\t\tvec2 center = (o+e)*.5;\n\t\tfloat inRegion = inRegion(o, e, texelCoord);\n\t\tfloat outRegion = 1.0 - inRegion;\n\t\t\n\t\tvec3 c = texture2D(texture, texelCoord).rgb;\n\t\t\n\t\tfloat l = distance(texelCoord, vec2(.5)) - 0.05;\n\t\tfloat vignetteMultiplier = 1.0 - clamp(0., 1.0, 2.0*l*l*l*l)*(outRegion);\n\t\t\n\t\tfloat minSaturation = 0.0;\n\t\tc = saturation(c, max(inRegion, minSaturation));\n\t\t\n\t\tc *= vignetteMultiplier;\n\t\tgl_FragColor = vec4(c, 1.0);\n\t}\n";
	}
	,__class__: FluidRender
});
var ColorParticleMotion = function() {
	RenderParticles.call(this);
};
$hxClasses["ColorParticleMotion"] = ColorParticleMotion;
ColorParticleMotion.__name__ = true;
ColorParticleMotion.__super__ = RenderParticles;
ColorParticleMotion.prototype = $extend(RenderParticles.prototype,{
	createProperties: function() {
		RenderParticles.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("dye",null,false);
		this.dye = instance;
		this._uniforms.push(instance);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_PARTICLE_VELOCITY_SCALE = 0.05; \n\n\nvec4 packParticlePosition(in vec2 p){\n    vec2 np = (p)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(np.x), packFloat8bitRG(np.y));\n}\n\nvec2 unpackParticlePosition(in vec4 pp){\n    vec2 np = vec2(unpackFloat8bitRG(pp.xy), unpackFloat8bitRG(pp.zw));\n    return (2.0*np.xy - 1.0);\n}\n\n\nvec4 packParticleVelocity(in vec2 v){\n    vec2 nv = (v * PACK_PARTICLE_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackParticleVelocity(in vec4 pv){\n    const float INV_PACK_PARTICLE_VELOCITY_SCALE = 1./PACK_PARTICLE_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_PARTICLE_VELOCITY_SCALE;\n}\n\tuniform sampler2D positionData;\n\tuniform sampler2D velocityData;\n\tattribute vec2 particleUV;\n\tvarying vec4 color;\n\t\n\n\nuniform sampler2D dye;\n\tvec3 saturation(in vec3 rgb, in float amount){\n\t\tconst vec3 CW = vec3(0.299, 0.587, 0.114);\n\t\tvec3 bw = vec3(dot(rgb, CW));\n\t\treturn mix(bw, rgb, amount);\n\t}\n\tconst float POINT_SIZE = 1.0;\n\tvoid main(){\n\t\tvec2 p = unpackParticlePosition(texture2D(positionData, particleUV));\n\t\tvec2 v = unpackParticleVelocity(texture2D(velocityData, particleUV));\n\n\t\tgl_PointSize = POINT_SIZE;\n\t\tgl_Position = vec4(p, 0.0, 1.0);\n\t\tvec3 dyeColor = texture2D(dye, p*.5+.5).rgb;\n\t\tfloat dyeLevel = dot(dyeColor, vec3(1.0));\n\t\tfloat speed = length(v);\n\t\tfloat x = clamp(speed * 2.0, 0., 1.);\n\t\tcolor.rgb = saturation(dyeColor, 1.0 + x) + (dyeLevel)*.05 + x*x*0.05;\n\t\tcolor.a = clamp(dyeLevel, 0.0, 1.0);\n\t}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nvarying vec4 color;\n\tvoid main(){\n\t\tgl_FragColor = vec4(color);\n\t}\n\n\n";
	}
	,__class__: ColorParticleMotion
});
var MouseDye = function() {
	UpdateDye.call(this);
};
$hxClasses["MouseDye"] = MouseDye;
MouseDye.__name__ = true;
MouseDye.__super__ = UpdateDye;
MouseDye.prototype = $extend(UpdateDye.prototype,{
	createProperties: function() {
		UpdateDye.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UBool("isMouseDown",null);
		this.isMouseDown = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec2("mouse",null);
		this.mouse = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UVec2("lastMouse",null);
		this.lastMouse = instance2;
		this._uniforms.push(instance2);
		var instance3 = new shaderblox_uniforms_UVec3("dyeColor",null);
		this.dyeColor = instance3;
		this._uniforms.push(instance3);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D dye;\n\tuniform float dt;\n\tuniform float dx;\n\tvarying vec2 texelCoord;\n\tvarying vec2 p;\n\n\nfloat distanceToSegment(vec2 a, vec2 b, vec2 p, out float fp){\n\tvec2 d = p - a;\n\tvec2 x = b - a;\n\n\tfp = 0.0; \n\tfloat lx = length(x);\n\t\n\tif(lx <= 0.0001) return length(d);\n\n\tfloat projection = dot(d, x / lx); \n\n\tfp = projection / lx;\n\n\tif(projection < 0.0)            return length(d);\n\telse if(projection > length(x)) return length(p - b);\n\treturn sqrt(abs(dot(d,d) - projection*projection));\n}\nfloat distanceToSegment(vec2 a, vec2 b, vec2 p){\n\tfloat fp;\n\treturn distanceToSegment(a, b, p, fp);\n}\n\tuniform bool isMouseDown;\n\tuniform vec2 mouse; \n\tuniform vec2 lastMouse;\n\tuniform vec3 dyeColor;\n\tvec3 saturation(in vec3 rgb, in float amount){\n\t\tconst vec3 CW = vec3(0.299, 0.587, 0.114);\n\t\tvec3 bw = vec3(dot(rgb, CW));\n\t\treturn mix(bw, rgb, amount);\n\t}\n\tvoid main(){\n\t\tvec4 color = texture2D(dye, texelCoord);\n\t\t\n\t\tcolor -= sign(color)*(0.006 - (1.0 - color)*0.004);\n\t\t\n\t\t\n\t\t\n\t\tif(isMouseDown){\t\t\t\n\t\t\tvec2 mouseVelocity = (mouse - lastMouse)/dt;\n\t\t\t\n\t\t\t\n\t\t\tfloat projection;\n\t\t\tfloat l = distanceToSegment(mouse, lastMouse, p, projection);\n\t\t\tfloat taperFactor = 0.6;\n\t\t\tfloat projectedFraction = 1.0 - clamp(projection, 0.0, 1.0)*taperFactor;\n\t\t\tfloat speed = 0.016*length(mouseVelocity)/dt;\n\t\t\tfloat x = speed;\n\t\t\t\t\t\t\t\t\t\n\t\t\tfloat R = 0.2;\n\t\t\tfloat m = 1.0*exp(-l/R);\n\t\t\tfloat m2 = m*m;\n\t\t\tfloat m3 = m2*m;\n\t\t\tfloat m4 = m3*m;\n\t\t\tfloat m6 = m4*m*m;\n\t\t\tcolor.rgb +=\n\t\t\t\t0.005*dyeColor*(16.0*m3*(0.3*x+1.0)+m2) \n\t\t\t  + 0.05*m6*vec3(1.0)*(0.5*m3*x + 1.0);     \n\t\t}\n\t\tgl_FragColor = color;\n\t}\n";
	}
	,__class__: MouseDye
});
var MouseForce = function() {
	ApplyForces.call(this);
};
$hxClasses["MouseForce"] = MouseForce;
MouseForce.__name__ = true;
MouseForce.__super__ = ApplyForces;
MouseForce.prototype = $extend(ApplyForces.prototype,{
	createProperties: function() {
		ApplyForces.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UBool("isMouseDown",null);
		this.isMouseDown = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UVec2("mouse",null);
		this.mouse = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UVec2("lastMouse",null);
		this.lastMouse = instance2;
		this._uniforms.push(instance2);
		this._aStride += 0;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\r\nattribute vec2 vertexPosition;\r\n\r\nuniform float aspectRatio;\r\n\r\nvarying vec2 texelCoord;\r\n\r\n\r\nvarying vec2 p;\n\r\nvoid main() {\r\n\ttexelCoord = vertexPosition;\r\n\t\r\n\tvec2 clipSpace = 2.0*texelCoord - 1.0;\t\n\t\r\n\tp = vec2(clipSpace.x * aspectRatio, clipSpace.y);\r\n\r\n\tgl_Position = vec4(clipSpace, 0.0, 1.0 );\t\r\n}\r\n\n\n\n\n\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\nuniform sampler2D velocity;\n\tuniform float dt;\n\tuniform float dx;\n\tvarying vec2 texelCoord;\n\tvarying vec2 p;\n\n\nfloat distanceToSegment(vec2 a, vec2 b, vec2 p, out float fp){\n\tvec2 d = p - a;\n\tvec2 x = b - a;\n\n\tfp = 0.0; \n\tfloat lx = length(x);\n\t\n\tif(lx <= 0.0001) return length(d);\n\n\tfloat projection = dot(d, x / lx); \n\n\tfp = projection / lx;\n\n\tif(projection < 0.0)            return length(d);\n\telse if(projection > length(x)) return length(p - b);\n\treturn sqrt(abs(dot(d,d) - projection*projection));\n}\nfloat distanceToSegment(vec2 a, vec2 b, vec2 p){\n\tfloat fp;\n\treturn distanceToSegment(a, b, p, fp);\n}\nfloat rand(vec2 co){\n\treturn fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\tuniform bool isMouseDown;\n\tuniform vec2 mouse; \n\tuniform vec2 lastMouse;\n\tvoid main(){\n\t\tvec2 v = sampleVelocity(velocity, texelCoord);\n\t\t\n\t\t\n\t\tv *= 0.999;\n\t\tif(isMouseDown){\n\t\t\tvec2 mouseVelocity = -(lastMouse - mouse)/dt;\n\t\t\t\n\t\t\t\t\n\t\t\t\n\t\t\tfloat projection;\n\t\t\tfloat l = distanceToSegment(mouse, lastMouse, p, projection);\n\t\t\tfloat taperFactor = 0.6;\n\t\t\tfloat projectedFraction = 1.0 - clamp(projection, 0.0, 1.0)*taperFactor;\n\t\t\tfloat R = 0.02;\n\t\t\tfloat m = exp(-l/R); \n\t\t\tm *= projectedFraction * projectedFraction;\n\t\t\tvec2 targetVelocity = mouseVelocity * dx * 1.4;\n\t\t\tv += (targetVelocity - v)*(m + m*m*8.0)*(0.3);\n\t\t}\n\t\t\n\t\t\n\t\tgl_FragColor = packFluidVelocity(v);\n\t}\n";
	}
	,__class__: MouseForce
});
var DebugBlitTexture = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["DebugBlitTexture"] = DebugBlitTexture;
DebugBlitTexture.__name__ = true;
DebugBlitTexture.__super__ = shaderblox_ShaderBase;
DebugBlitTexture.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UVec2("invresolution",null);
		this.invresolution = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_uniforms_UFloat("aspectRatio",null);
		this.aspectRatio = instance1;
		this._uniforms.push(instance1);
		var instance2 = new shaderblox_uniforms_UTexture("texture",null,false);
		this.texture = instance2;
		this._uniforms.push(instance2);
		var instance3 = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance3;
		this._attributes.push(instance3);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\nvarying vec2 texelCoord;\n\nvoid main() {\n\ttexelCoord = vertexPosition;\n\tgl_Position = vec4(vertexPosition*2.0 - vec2(1.0, 1.0), 0.0, 1.0 );\n}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\n\n\n#define PRESSURE_BOUNDARY\n#define VELOCITY_BOUNDARY\n\nuniform vec2 invresolution;\nuniform float aspectRatio;\n\nvec2 clipToAspectSpace(in vec2 p){\n    return vec2(p.x * aspectRatio, p.y);\n}\n\nvec2 aspectToTexelSpace(in vec2 p){\n    return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;\n}\n\n\n#define FLOAT_PACKING_LIB\n\n\nvec4 packFloat8bitRGBA(in float val) {\n    vec4 pack = vec4(1.0, 255.0, 65025.0, 16581375.0) * val;\n    pack = fract(pack);\n    pack -= vec4(pack.yzw / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGBA(in vec4 pack) {\n    return dot(pack, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n}\n\nvec3 packFloat8bitRGB(in float val) {\n    vec3 pack = vec3(1.0, 255.0, 65025.0) * val;\n    pack = fract(pack);\n    pack -= vec3(pack.yz / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRGB(in vec3 pack) {\n    return dot(pack, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));\n}\n\nvec2 packFloat8bitRG(in float val) {\n    vec2 pack = vec2(1.0, 255.0) * val;\n    pack = fract(pack);\n    pack -= vec2(pack.y / 255.0, 0.0);\n    return pack;\n}\n\nfloat unpackFloat8bitRG(in vec2 pack) {\n    return dot(pack, vec2(1.0, 1.0 / 255.0));\n}\n\n\nconst float PACK_FLUID_VELOCITY_SCALE = 0.0025; \nconst float PACK_FLUID_PRESSURE_SCALE = 0.00025;\nconst float PACK_FLUID_DIVERGENCE_SCALE = 0.25;\n\n\nvec4 packFluidVelocity(in vec2 v){\n    vec2 nv = (v * PACK_FLUID_VELOCITY_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRG(nv.x), packFloat8bitRG(nv.y));\n}\n\nvec2 unpackFluidVelocity(in vec4 pv){\n    const float INV_PACK_FLUID_VELOCITY_SCALE = 1./PACK_FLUID_VELOCITY_SCALE;\n    vec2 nv = vec2(unpackFloat8bitRG(pv.xy), unpackFloat8bitRG(pv.zw));\n    return (2.0*nv.xy - 1.0)* INV_PACK_FLUID_VELOCITY_SCALE;\n}\n\n\nvec4 packFluidPressure(in float p){\n    float np = (p * PACK_FLUID_PRESSURE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(np), 0.0);\n}\n\nfloat unpackFluidPressure(in vec4 pp){\n    const float INV_PACK_FLUID_PRESSURE_SCALE = 1./PACK_FLUID_PRESSURE_SCALE;\n    float np = unpackFloat8bitRGB(pp.rgb);\n    return (2.0*np - 1.0) * INV_PACK_FLUID_PRESSURE_SCALE;\n}\n\n\nvec4 packFluidDivergence(in float d){\n    float nd = (d * PACK_FLUID_DIVERGENCE_SCALE)*0.5 + 0.5;\n    return vec4(packFloat8bitRGB(nd), 0.0);\n}\n\nfloat unpackFluidDivergence(in vec4 pd){\n    const float INV_PACK_FLUID_DIVERGENCE_SCALE = 1./PACK_FLUID_DIVERGENCE_SCALE;\n    float nd = unpackFloat8bitRGB(pd.rgb);\n    return (2.0*nd - 1.0) * INV_PACK_FLUID_DIVERGENCE_SCALE;\n}\n\n\nfloat samplePressue(in sampler2D pressure, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n\n    #ifdef PRESSURE_BOUNDARY\n    \n    \n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    #endif\n\n    return unpackFluidPressure(texture2D(pressure, coord + cellOffset * invresolution));\n}\n\n\n\nvec2 sampleVelocity(in sampler2D velocity, in vec2 coord){\n    vec2 cellOffset = vec2(0.0, 0.0);\n    vec2 multiplier = vec2(1.0, 1.0);\n\n    #ifdef VELOCITY_BOUNDARY\n    \n    \n    \n    \n    \n    \n    cellOffset = -floor(coord);\n    multiplier -= 2.0*abs(cellOffset);\n    #endif\n\n    vec2 v = unpackFluidVelocity(texture2D(velocity, coord + cellOffset * invresolution));\n    return multiplier * v;\n}\n\n#define sampleDivergence(divergence, coord) unpackFluidDivergence(texture2D(divergence, coord))\n\n\n\tuniform sampler2D texture;\n\tvarying vec2 texelCoord;\n\tvoid main(void){\n\t\tfloat d = sampleDivergence(texture, texelCoord);\n\t\tgl_FragColor = vec4(d, -d, 0.0, 1.0);\n\t}\n";
	}
	,__class__: DebugBlitTexture
});
Math.__name__ = true;
var PerformanceMonitor = function(lowerBoundFPS,upperBoundFPS,thresholdTime_ms,fpsSampleSize) {
	if(fpsSampleSize == null) fpsSampleSize = 30;
	if(thresholdTime_ms == null) thresholdTime_ms = 3000;
	if(lowerBoundFPS == null) lowerBoundFPS = 30;
	this.upperBoundEnterTime = null;
	this.lowerBoundEnterTime = null;
	this.fpsTooHighCallback = null;
	this.fpsTooLowCallback = null;
	this.fpsIgnoreBounds = [5,180];
	this.lowerBoundFPS = lowerBoundFPS;
	this.upperBoundFPS = upperBoundFPS;
	this.thresholdTime_ms = thresholdTime_ms;
	this.fpsSample = new RollingSample(fpsSampleSize);
};
$hxClasses["PerformanceMonitor"] = PerformanceMonitor;
PerformanceMonitor.__name__ = true;
PerformanceMonitor.prototype = {
	__class__: PerformanceMonitor
};
var RollingSample = function(length) {
	this.m2 = 0;
	this.pos = 0;
	this.sampleCount = 0;
	this.standardDeviation = 0;
	this.variance = 0;
	this.average = 0;
	var tmp;
	var this1;
	this1 = new Array(length);
	tmp = this1;
	this.samples = tmp;
};
$hxClasses["RollingSample"] = RollingSample;
RollingSample.__name__ = true;
RollingSample.prototype = {
	add: function(v) {
		var delta;
		if(this.sampleCount >= this.samples.length) {
			var bottomValue = this.samples[this.pos];
			delta = bottomValue - this.average;
			this.average -= delta / (this.sampleCount - 1);
			this.m2 -= delta * (bottomValue - this.average);
		} else this.sampleCount++;
		delta = v - this.average;
		this.average += delta / this.sampleCount;
		this.m2 += delta * (v - this.average);
		this.samples[this.pos] = v;
		this.pos++;
		this.pos %= this.samples.length;
		return this.pos;
	}
	,clear: function() {
		var _g1 = 0;
		var _g = this.samples.length;
		while(_g1 < _g) {
			var i = _g1++;
			this.samples[i] = 0;
		}
		this.average = 0;
		this.variance = 0;
		this.standardDeviation = 0;
		this.sampleCount = 0;
		this.m2 = 0;
	}
	,__class__: RollingSample
};
var Reflect = function() { };
$hxClasses["Reflect"] = Reflect;
Reflect.__name__ = true;
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
var SnowApp = function() { };
$hxClasses["SnowApp"] = SnowApp;
SnowApp.__name__ = true;
SnowApp.main = function() {
	SnowApp._snow = new snow_Snow();
	SnowApp._host = new Main();
	var _snow_config = { has_loop : true, config_path : "config.json", app_package : "com.haxiomic.gpufluid"};
	SnowApp._snow.init(_snow_config,SnowApp._host);
};
var Std = function() { };
$hxClasses["Std"] = Std;
Std.__name__ = true;
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
var StringTools = function() { };
$hxClasses["StringTools"] = StringTools;
StringTools.__name__ = true;
StringTools.isSpace = function(s,pos) {
	var c = HxOverrides.cca(s,pos);
	return c > 8 && c < 14 || c == 32;
};
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return HxOverrides.substr(s,r,l - r); else return s;
};
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return HxOverrides.substr(s,0,l - r); else return s;
};
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
};
var Type = function() { };
$hxClasses["Type"] = Type;
Type.__name__ = true;
Type.resolveClass = function(name) {
	var cl = $hxClasses[name];
	if(cl == null || !cl.__name__) return null;
	return cl;
};
Type.resolveEnum = function(name) {
	var e = $hxClasses[name];
	if(e == null || !e.__ename__) return null;
	return e;
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw new js__$Boot_HaxeError("No such constructor " + constr);
	if(Reflect.isFunction(f)) {
		if(params == null) throw new js__$Boot_HaxeError("Constructor " + constr + " need parameters");
		var tmp;
		var func = f;
		tmp = func.apply(e,params);
		return tmp;
	}
	if(params != null && params.length != 0) throw new js__$Boot_HaxeError("Constructor " + constr + " does not need parameters");
	return f;
};
Type.createEnumIndex = function(e,index,params) {
	var c = e.__constructs__[index];
	if(c == null) throw new js__$Boot_HaxeError(index + " is not a valid enum constructor index");
	return Type.createEnum(e,c,params);
};
Type.allEnums = function(e) {
	return e.__empty_constructs__;
};
var gltoolbox_GeometryTools = function() { };
$hxClasses["gltoolbox.GeometryTools"] = gltoolbox_GeometryTools;
gltoolbox_GeometryTools.__name__ = true;
gltoolbox_GeometryTools.getCachedUnitQuad = function(drawMode) {
	if(drawMode == null) drawMode = 5;
	var unitQuad = gltoolbox_GeometryTools.unitQuadCache.h[drawMode];
	if(unitQuad == null || !snow_modules_opengl_web_GL.current_context.isBuffer(unitQuad)) {
		unitQuad = gltoolbox_GeometryTools.createQuad(0,0,1,1,drawMode);
		gltoolbox_GeometryTools.unitQuadCache.h[drawMode] = unitQuad;
	}
	return unitQuad;
};
gltoolbox_GeometryTools.createQuad = function(originX,originY,width,height,drawMode,usage) {
	if(usage == null) usage = 35044;
	if(drawMode == null) drawMode = 5;
	if(height == null) height = 1;
	if(width == null) width = 1;
	if(originY == null) originY = 0;
	if(originX == null) originX = 0;
	var quad = snow_modules_opengl_web_GL.current_context.createBuffer();
	var vertices = [];
	switch(drawMode) {
	case 5:case 4:
		vertices = [originX,originY + height,originX,originY,originX + width,originY + height,originX + width,originY];
		if(drawMode == 4) vertices = vertices.concat([originX + width,originY + height,originX,originY]);
		break;
	case 6:
		vertices = [originX,originY + height,originX,originY,originX + width,originY,originX + width,originY + height];
		break;
	}
	snow_modules_opengl_web_GL.current_context.bindBuffer(34962,quad);
	var tmp;
	var this1;
	if(vertices != null) this1 = new Float32Array(vertices); else this1 = null;
	tmp = this1;
	var data = tmp;
	snow_modules_opengl_web_GL.current_context.bufferData(34962,data,usage);
	snow_modules_opengl_web_GL.current_context.bindBuffer(34962,null);
	return quad;
};
var gltoolbox_TextureTools = function() { };
$hxClasses["gltoolbox.TextureTools"] = gltoolbox_TextureTools;
gltoolbox_TextureTools.__name__ = true;
gltoolbox_TextureTools.createTexture = function(width,height,params) {
	if(params == null) params = { };
	var _g = 0;
	var _g1 = Reflect.fields(gltoolbox_TextureTools.defaultParams);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		if(!Object.prototype.hasOwnProperty.call(params,f)) {
			var value = Reflect.field(gltoolbox_TextureTools.defaultParams,f);
			params[f] = value;
		}
	}
	var texture = snow_modules_opengl_web_GL.current_context.createTexture();
	snow_modules_opengl_web_GL.current_context.bindTexture(3553,texture);
	snow_modules_opengl_web_GL.current_context.texParameteri(3553,10241,params.filter);
	snow_modules_opengl_web_GL.current_context.texParameteri(3553,10240,params.filter);
	snow_modules_opengl_web_GL.current_context.texParameteri(3553,10242,params.wrapS);
	snow_modules_opengl_web_GL.current_context.texParameteri(3553,10243,params.wrapT);
	snow_modules_opengl_web_GL.current_context.pixelStorei(3317,params.unpackAlignment);
	snow_modules_opengl_web_GL.current_context.texImage2D(3553,0,params.channelType,width,height,0,params.channelType,params.dataType,null);
	snow_modules_opengl_web_GL.current_context.bindTexture(3553,null);
	return texture;
};
var gltoolbox_render_ITargetable = function() { };
$hxClasses["gltoolbox.render.ITargetable"] = gltoolbox_render_ITargetable;
gltoolbox_render_ITargetable.__name__ = true;
gltoolbox_render_ITargetable.prototype = {
	__class__: gltoolbox_render_ITargetable
};
var gltoolbox_render_RenderTarget = function(width,height,textureFactory) {
	if(textureFactory == null) textureFactory = function(width1,height1) {
		return gltoolbox_TextureTools.createTexture(width1,height1,null);
	};
	this.width = width;
	this.height = height;
	this.textureFactory = textureFactory;
	this.texture = textureFactory(width,height);
	if(gltoolbox_render_RenderTarget.textureQuad == null) gltoolbox_render_RenderTarget.textureQuad = gltoolbox_GeometryTools.getCachedUnitQuad(5);
	this.frameBufferObject = snow_modules_opengl_web_GL.current_context.createFramebuffer();
	var newTexture = this.textureFactory(width,height);
	snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.frameBufferObject);
	snow_modules_opengl_web_GL.current_context.framebufferTexture2D(36160,36064,3553,newTexture,0);
	if(this.texture != null) {
		var resampler = gltoolbox_shaders_Resample.instance;
		var _this = resampler.texture;
		_this.dirty = true;
		_this.data = this.texture;
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.frameBufferObject);
		snow_modules_opengl_web_GL.current_context.viewport(0,0,width,height);
		snow_modules_opengl_web_GL.current_context.bindBuffer(34962,gltoolbox_render_RenderTarget.textureQuad);
		if(resampler._active) {
			var _g = 0;
			var _g1 = resampler._uniforms;
			while(_g < _g1.length) {
				var u = _g1[_g];
				++_g;
				u.apply();
			}
			var offset = 0;
			var _g11 = 0;
			var _g2 = resampler._attributes.length;
			while(_g11 < _g2) {
				var i = _g11++;
				var att = resampler._attributes[i];
				var location = att.location;
				if(location != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,resampler._aStride,offset);
				}
				offset += att.byteSize;
			}
		} else {
			if(!resampler._ready) resampler.create();
			snow_modules_opengl_web_GL.current_context.useProgram(resampler._prog);
			var _g3 = 0;
			var _g12 = resampler._uniforms;
			while(_g3 < _g12.length) {
				var u1 = _g12[_g3];
				++_g3;
				u1.apply();
			}
			var offset1 = 0;
			var _g13 = 0;
			var _g4 = resampler._attributes.length;
			while(_g13 < _g4) {
				var i1 = _g13++;
				var att1 = resampler._attributes[i1];
				var location1 = att1.location;
				if(location1 != -1) {
					snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
					snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,resampler._aStride,offset1);
				}
				offset1 += att1.byteSize;
			}
			resampler._active = true;
		}
		snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
		resampler.deactivate();
		snow_modules_opengl_web_GL.current_context.deleteTexture(this.texture);
	} else {
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.frameBufferObject);
		snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
		snow_modules_opengl_web_GL.current_context.clear(16384);
	}
	this.width = width;
	this.height = height;
	this.texture = newTexture;
	this;
};
$hxClasses["gltoolbox.render.RenderTarget"] = gltoolbox_render_RenderTarget;
gltoolbox_render_RenderTarget.__name__ = true;
gltoolbox_render_RenderTarget.__interfaces__ = [gltoolbox_render_ITargetable];
gltoolbox_render_RenderTarget.prototype = {
	activate: function() {
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.frameBufferObject);
	}
	,__class__: gltoolbox_render_RenderTarget
};
var gltoolbox_render_RenderTarget2Phase = function(width,height,textureFactory) {
	if(textureFactory == null) textureFactory = function(width1,height1) {
		return gltoolbox_TextureTools.createTexture(width1,height1,null);
	};
	this.width = width;
	this.height = height;
	this.textureFactory = textureFactory;
	if(gltoolbox_render_RenderTarget2Phase.textureQuad == null) gltoolbox_render_RenderTarget2Phase.textureQuad = gltoolbox_GeometryTools.getCachedUnitQuad(5);
	this.writeFrameBufferObject = snow_modules_opengl_web_GL.current_context.createFramebuffer();
	this.readFrameBufferObject = snow_modules_opengl_web_GL.current_context.createFramebuffer();
	this.resize(width,height);
};
$hxClasses["gltoolbox.render.RenderTarget2Phase"] = gltoolbox_render_RenderTarget2Phase;
gltoolbox_render_RenderTarget2Phase.__name__ = true;
gltoolbox_render_RenderTarget2Phase.__interfaces__ = [gltoolbox_render_ITargetable];
gltoolbox_render_RenderTarget2Phase.prototype = {
	resize: function(width,height) {
		var newWriteToTexture = this.textureFactory(width,height);
		var newReadFromTexture = this.textureFactory(width,height);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.writeFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.framebufferTexture2D(36160,36064,3553,newWriteToTexture,0);
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.readFrameBufferObject);
		snow_modules_opengl_web_GL.current_context.framebufferTexture2D(36160,36064,3553,newReadFromTexture,0);
		if(this.readFromTexture != null) {
			var resampler = gltoolbox_shaders_Resample.instance;
			var _this = resampler.texture;
			_this.dirty = true;
			_this.data = this.readFromTexture;
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.readFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.viewport(0,0,width,height);
			snow_modules_opengl_web_GL.current_context.bindBuffer(34962,gltoolbox_render_RenderTarget2Phase.textureQuad);
			if(resampler._active) {
				var _g = 0;
				var _g1 = resampler._uniforms;
				while(_g < _g1.length) {
					var u = _g1[_g];
					++_g;
					u.apply();
				}
				var offset = 0;
				var _g11 = 0;
				var _g2 = resampler._attributes.length;
				while(_g11 < _g2) {
					var i = _g11++;
					var att = resampler._attributes[i];
					var location = att.location;
					if(location != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location,att.itemCount,att.type,false,resampler._aStride,offset);
					}
					offset += att.byteSize;
				}
			} else {
				if(!resampler._ready) resampler.create();
				snow_modules_opengl_web_GL.current_context.useProgram(resampler._prog);
				var _g3 = 0;
				var _g12 = resampler._uniforms;
				while(_g3 < _g12.length) {
					var u1 = _g12[_g3];
					++_g3;
					u1.apply();
				}
				var offset1 = 0;
				var _g13 = 0;
				var _g4 = resampler._attributes.length;
				while(_g13 < _g4) {
					var i1 = _g13++;
					var att1 = resampler._attributes[i1];
					var location1 = att1.location;
					if(location1 != -1) {
						snow_modules_opengl_web_GL.current_context.enableVertexAttribArray(location1);
						snow_modules_opengl_web_GL.current_context.vertexAttribPointer(location1,att1.itemCount,att1.type,false,resampler._aStride,offset1);
					}
					offset1 += att1.byteSize;
				}
				resampler._active = true;
			}
			snow_modules_opengl_web_GL.current_context.drawArrays(5,0,4);
			resampler.deactivate();
			snow_modules_opengl_web_GL.current_context.deleteTexture(this.readFromTexture);
		} else {
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.readFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
			snow_modules_opengl_web_GL.current_context.clear(16384);
		}
		if(this.writeToTexture != null) snow_modules_opengl_web_GL.current_context.deleteTexture(this.writeToTexture); else {
			snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.writeFrameBufferObject);
			snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1);
			snow_modules_opengl_web_GL.current_context.clear(16384);
		}
		this.width = width;
		this.height = height;
		this.writeToTexture = newWriteToTexture;
		this.readFromTexture = newReadFromTexture;
		return this;
	}
	,activate: function() {
		snow_modules_opengl_web_GL.current_context.bindFramebuffer(36160,this.writeFrameBufferObject);
	}
	,__class__: gltoolbox_render_RenderTarget2Phase
};
var js_Boot = function() { };
$hxClasses["js.Boot"] = js_Boot;
js_Boot.__name__ = true;
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return (Function("return typeof " + name + " != \"undefined\" ? " + name + " : null"))();
};
var gltoolbox_shaders_Resample = function() {
	shaderblox_ShaderBase.call(this);
};
$hxClasses["gltoolbox.shaders.Resample"] = gltoolbox_shaders_Resample;
gltoolbox_shaders_Resample.__name__ = true;
gltoolbox_shaders_Resample.__super__ = shaderblox_ShaderBase;
gltoolbox_shaders_Resample.prototype = $extend(shaderblox_ShaderBase.prototype,{
	createProperties: function() {
		shaderblox_ShaderBase.prototype.createProperties.call(this);
		var instance = new shaderblox_uniforms_UTexture("texture",null,false);
		this.texture = instance;
		this._uniforms.push(instance);
		var instance1 = new shaderblox_attributes_FloatAttribute("vertexPosition",0,2);
		this.vertexPosition = instance1;
		this._attributes.push(instance1);
		this._aStride += 8;
	}
	,initSources: function() {
		this._vertSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nattribute vec2 vertexPosition;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\ttexelCoord = vertexPosition;\n\t\tgl_Position = vec4(vertexPosition*2.0 - 1.0, 0.0, 1.0 );\n\t}\n";
		this._fragSource = "\n#ifdef GL_ES\nprecision highp float;\nprecision highp sampler2D;\n#endif\n\nuniform sampler2D texture;\n\tvarying vec2 texelCoord;\n\tvoid main(){\n\t\tgl_FragColor = texture2D(texture, texelCoord);\n\t}\n";
	}
	,__class__: gltoolbox_shaders_Resample
});
var haxe_IMap = function() { };
$hxClasses["haxe.IMap"] = haxe_IMap;
haxe_IMap.__name__ = true;
haxe_IMap.prototype = {
	__class__: haxe_IMap
};
var haxe__$Int64__$_$_$Int64 = function(high,low) {
	this.high = high;
	this.low = low;
};
$hxClasses["haxe._Int64.___Int64"] = haxe__$Int64__$_$_$Int64;
haxe__$Int64__$_$_$Int64.__name__ = true;
haxe__$Int64__$_$_$Int64.prototype = {
	__class__: haxe__$Int64__$_$_$Int64
};
var haxe_Timer = function() { };
$hxClasses["haxe.Timer"] = haxe_Timer;
haxe_Timer.__name__ = true;
haxe_Timer.stamp = function() {
	return new Date().getTime() / 1000;
};
var haxe_ds_IntMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.IntMap"] = haxe_ds_IntMap;
haxe_ds_IntMap.__name__ = true;
haxe_ds_IntMap.__interfaces__ = [haxe_IMap];
haxe_ds_IntMap.prototype = {
	set: function(key,value) {
		this.h[key] = value;
	}
	,remove: function(key) {
		if(!this.h.hasOwnProperty(key)) return false;
		delete(this.h[key]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i];
		}};
	}
	,__class__: haxe_ds_IntMap
};
var haxe_ds_ObjectMap = function() {
	this.h = { };
	this.h.__keys__ = { };
};
$hxClasses["haxe.ds.ObjectMap"] = haxe_ds_ObjectMap;
haxe_ds_ObjectMap.__name__ = true;
haxe_ds_ObjectMap.__interfaces__ = [haxe_IMap];
haxe_ds_ObjectMap.prototype = {
	set: function(key,value) {
		var id = key.__id__ || (key.__id__ = ++haxe_ds_ObjectMap.count);
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,remove: function(key) {
		var id = key.__id__;
		if(this.h.__keys__[id] == null) return false;
		delete(this.h[id]);
		delete(this.h.__keys__[id]);
		return true;
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) a.push(this.h.__keys__[key]);
		}
		return HxOverrides.iter(a);
	}
	,iterator: function() {
		return { ref : this.h, it : this.keys(), hasNext : function() {
			return this.it.hasNext();
		}, next : function() {
			var i = this.it.next();
			return this.ref[i.__id__];
		}};
	}
	,__class__: haxe_ds_ObjectMap
};
var haxe_ds__$StringMap_StringMapIterator = function(map,keys) {
	this.map = map;
	this.keys = keys;
	this.index = 0;
	this.count = keys.length;
};
$hxClasses["haxe.ds._StringMap.StringMapIterator"] = haxe_ds__$StringMap_StringMapIterator;
haxe_ds__$StringMap_StringMapIterator.__name__ = true;
haxe_ds__$StringMap_StringMapIterator.prototype = {
	hasNext: function() {
		return this.index < this.count;
	}
	,next: function() {
		var tmp;
		var _this = this.map;
		var key = this.keys[this.index++];
		if(__map_reserved[key] != null) tmp = _this.getReserved(key); else tmp = _this.h[key];
		return tmp;
	}
	,__class__: haxe_ds__$StringMap_StringMapIterator
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.StringMap"] = haxe_ds_StringMap;
haxe_ds_StringMap.__name__ = true;
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		return this.rh == null?null:this.rh["$" + key];
	}
	,existsReserved: function(key) {
		if(this.rh == null) return false;
		return this.rh.hasOwnProperty("$" + key);
	}
	,remove: function(key) {
		if(__map_reserved[key] != null) {
			key = "$" + key;
			if(this.rh == null || !this.rh.hasOwnProperty(key)) return false;
			delete(this.rh[key]);
			return true;
		} else {
			if(!this.h.hasOwnProperty(key)) return false;
			delete(this.h[key]);
			return true;
		}
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
	,__class__: haxe_ds_StringMap
};
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
$hxClasses["haxe.io.Bytes"] = haxe_io_Bytes;
haxe_io_Bytes.__name__ = true;
haxe_io_Bytes.prototype = {
	getString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				var u = (c & 15) << 18 | (c21 & 127) << 12 | (c3 & 127) << 6 | b[i++] & 127;
				s += fcc((u >> 10) + 55232);
				s += fcc(u & 1023 | 56320);
			}
		}
		return s;
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
	,__class__: haxe_io_Bytes
};
var haxe_io_Error = $hxClasses["haxe.io.Error"] = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
haxe_io_Error.__empty_constructs__ = [haxe_io_Error.Blocked,haxe_io_Error.Overflow,haxe_io_Error.OutsideBounds];
var haxe_io_FPHelper = function() { };
$hxClasses["haxe.io.FPHelper"] = haxe_io_FPHelper;
haxe_io_FPHelper.__name__ = true;
haxe_io_FPHelper.i32ToFloat = function(i) {
	var sign = 1 - (i >>> 31 << 1);
	var exp = i >>> 23 & 255;
	var sig = i & 8388607;
	if(sig == 0 && exp == 0) return 0.0;
	return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp - 127);
};
haxe_io_FPHelper.floatToI32 = function(f) {
	if(f == 0) return 0;
	var af = f < 0?-f:f;
	var exp = Math.floor(Math.log(af) / 0.6931471805599453);
	if(exp < -127) exp = -127; else if(exp > 128) exp = 128;
	var sig = Math.round((af / Math.pow(2,exp) - 1) * 8388608) & 8388607;
	return (f < 0?-2147483648:0) | exp + 127 << 23 | sig;
};
haxe_io_FPHelper.i64ToDouble = function(low,high) {
	var sign = 1 - (high >>> 31 << 1);
	var exp = (high >> 20 & 2047) - 1023;
	var sig = (high & 1048575) * 4294967296. + (low >>> 31) * 2147483648. + (low & 2147483647);
	if(sig == 0 && exp == -1023) return 0.0;
	return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
};
haxe_io_FPHelper.doubleToI64 = function(v) {
	var i64 = haxe_io_FPHelper.i64tmp;
	if(v == 0) {
		i64.low = 0;
		i64.high = 0;
	} else {
		var av = v < 0?-v:v;
		var exp = Math.floor(Math.log(av) / 0.6931471805599453);
		var tmp;
		var v1 = (av / Math.pow(2,exp) - 1) * 4503599627370496.;
		tmp = Math.round(v1);
		var sig = tmp;
		var sig_l = sig | 0;
		var sig_h = sig / 4294967296.0 | 0;
		i64.low = sig_l;
		i64.high = (v < 0?-2147483648:0) | exp + 1023 << 20 | sig_h;
	}
	return i64;
};
var haxe_io_Path = function() { };
$hxClasses["haxe.io.Path"] = haxe_io_Path;
haxe_io_Path.__name__ = true;
haxe_io_Path.join = function(paths) {
	var paths1 = paths.filter(function(s) {
		return s != null && s != "";
	});
	if(paths1.length == 0) return "";
	var path = paths1[0];
	var _g1 = 1;
	var _g = paths1.length;
	while(_g1 < _g) {
		var i = _g1++;
		path = haxe_io_Path.addTrailingSlash(path);
		path += paths1[i];
	}
	return haxe_io_Path.normalize(path);
};
haxe_io_Path.normalize = function(path) {
	path = path.split("\\").join("/");
	if(path == null || path == "/") return "/";
	var target = [];
	var _g = 0;
	var _g1 = path.split("/");
	while(_g < _g1.length) {
		var token = _g1[_g];
		++_g;
		if(token == ".." && target.length > 0 && target[target.length - 1] != "..") target.pop(); else if(token != ".") target.push(token);
	}
	var tmp = target.join("/");
	var regex = new EReg("([^:])/+","g");
	regex.replace(tmp,"$1" + "/");
	var acc_b = "";
	var colon = false;
	var slashes = false;
	var _g11 = 0;
	var _g2 = tmp.length;
	while(_g11 < _g2) {
		var i = _g11++;
		var _g21 = HxOverrides.cca(tmp,i);
		if(_g21 != null) switch(_g21) {
		case 58:
			acc_b += ":";
			colon = true;
			break;
		case 47:
			if(colon == false) slashes = true; else {
				colon = false;
				if(slashes) {
					acc_b += "/";
					slashes = false;
				}
				var x = String.fromCharCode(_g21);
				acc_b += x == null?"null":"" + x;
			}
			break;
		default:
			colon = false;
			if(slashes) {
				acc_b += "/";
				slashes = false;
			}
			var x1 = String.fromCharCode(_g21);
			acc_b += x1 == null?"null":"" + x1;
		} else {
			colon = false;
			if(slashes) {
				acc_b += "/";
				slashes = false;
			}
			var x1 = String.fromCharCode(_g21);
			acc_b += x1 == null?"null":"" + x1;
		}
	}
	var result = acc_b;
	return result;
};
haxe_io_Path.addTrailingSlash = function(path) {
	if(path.length == 0) return "/";
	var c1 = path.lastIndexOf("/");
	var c2 = path.lastIndexOf("\\");
	return c1 < c2?c2 != path.length - 1?path + "\\":path:c1 != path.length - 1?path + "/":path;
};
var hxColorToolkit_spaces_Color = function() { };
$hxClasses["hxColorToolkit.spaces.Color"] = hxColorToolkit_spaces_Color;
hxColorToolkit_spaces_Color.__name__ = true;
var hxColorToolkit_spaces_RGB = function(r,g,b) {
	if(b == null) b = 0;
	if(g == null) g = 0;
	if(r == null) r = 0;
	this.numOfChannels = 3;
	this.data = [];
	this.set_red(r);
	this.set_green(g);
	this.set_blue(b);
};
$hxClasses["hxColorToolkit.spaces.RGB"] = hxColorToolkit_spaces_RGB;
hxColorToolkit_spaces_RGB.__name__ = true;
hxColorToolkit_spaces_RGB.__interfaces__ = [hxColorToolkit_spaces_Color];
hxColorToolkit_spaces_RGB.prototype = {
	getValue: function(channel) {
		return this.data[channel];
	}
	,setValue: function(channel,val) {
		this.data[channel] = Math.min(255,Math.max(val,0));
		return val;
	}
	,get_red: function() {
		return this.getValue(0);
	}
	,set_red: function(value) {
		return this.setValue(0,value);
	}
	,get_green: function() {
		return this.getValue(1);
	}
	,set_green: function(value) {
		return this.setValue(1,value);
	}
	,get_blue: function() {
		return this.getValue(2);
	}
	,set_blue: function(value) {
		return this.setValue(2,value);
	}
	,__class__: hxColorToolkit_spaces_RGB
};
var hxColorToolkit_spaces_HSB = function(hue,saturation,brightness) {
	if(brightness == null) brightness = 0;
	if(saturation == null) saturation = 0;
	if(hue == null) hue = 0;
	this.numOfChannels = 3;
	this.data = [];
	this.set_hue(hue);
	this.set_saturation(saturation);
	this.set_brightness(brightness);
};
$hxClasses["hxColorToolkit.spaces.HSB"] = hxColorToolkit_spaces_HSB;
hxColorToolkit_spaces_HSB.__name__ = true;
hxColorToolkit_spaces_HSB.__interfaces__ = [hxColorToolkit_spaces_Color];
hxColorToolkit_spaces_HSB.loop = function(index,length) {
	if(index < 0) index = length + index % length;
	if(index >= length) index %= length;
	return index;
};
hxColorToolkit_spaces_HSB.prototype = {
	getValue: function(channel) {
		return this.data[channel];
	}
	,get_hue: function() {
		return this.getValue(0);
	}
	,set_hue: function(val) {
		this.data[0] = hxColorToolkit_spaces_HSB.loop(val,360);
		return val;
	}
	,get_saturation: function() {
		return this.getValue(1);
	}
	,set_saturation: function(val) {
		this.data[1] = Math.min(100,Math.max(val,0));
		return val;
	}
	,get_brightness: function() {
		return this.getValue(2);
	}
	,set_brightness: function(val) {
		this.data[2] = Math.min(100,Math.max(val,0));
		return val;
	}
	,toRGB: function() {
		var hue = this.get_hue();
		var saturation = this.get_saturation();
		var brightness = this.get_brightness();
		var r = 0;
		var g = 0;
		var b = 0;
		var i;
		var f;
		var p;
		var q;
		var t;
		hue %= 360;
		if(brightness == 0) return new hxColorToolkit_spaces_RGB();
		saturation *= 0.01;
		brightness *= 0.01;
		hue /= 60;
		i = Math.floor(hue);
		f = hue - i;
		p = brightness * (1 - saturation);
		q = brightness * (1 - saturation * f);
		t = brightness * (1 - saturation * (1 - f));
		if(i == 0) {
			r = brightness;
			g = t;
			b = p;
		} else if(i == 1) {
			r = q;
			g = brightness;
			b = p;
		} else if(i == 2) {
			r = p;
			g = brightness;
			b = t;
		} else if(i == 3) {
			r = p;
			g = q;
			b = brightness;
		} else if(i == 4) {
			r = t;
			g = p;
			b = brightness;
		} else if(i == 5) {
			r = brightness;
			g = p;
			b = q;
		}
		return new hxColorToolkit_spaces_RGB(r * 255,g * 255,b * 255);
	}
	,__class__: hxColorToolkit_spaces_HSB
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
$hxClasses["js._Boot.HaxeError"] = js__$Boot_HaxeError;
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
	__class__: js__$Boot_HaxeError
});
var js_Web = function() { };
$hxClasses["js.Web"] = js_Web;
js_Web.__name__ = true;
js_Web.getParams = function() {
	var result = new haxe_ds_StringMap();
	var paramObj = eval("\n\t\t\t(function() {\n\t\t\t    var match,\n\t\t\t        pl     = /\\+/g,  // Regex for replacing addition symbol with a space\n\t\t\t        search = /([^&=]+)=?([^&]*)/g,\n\t\t\t        decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); },\n\t\t\t        query  = window.location.search.substring(1);\n\n\t\t\t    var urlParams = {};\n\t\t\t    while (match = search.exec(query))\n\t\t\t       urlParams[decode(match[1])] = decode(match[2]);\n\t\t\t    return urlParams;\n\t\t\t})();\n\t\t");
	var _g = 0;
	var _g1 = Reflect.fields(paramObj);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		var value = Reflect.field(paramObj,f);
		if(__map_reserved[f] != null) result.setReserved(f,value); else result.h[f] = value;
	}
	return result;
};
var js_html__$CanvasElement_CanvasUtil = function() { };
$hxClasses["js.html._CanvasElement.CanvasUtil"] = js_html__$CanvasElement_CanvasUtil;
js_html__$CanvasElement_CanvasUtil.__name__ = true;
js_html__$CanvasElement_CanvasUtil.getContextWebGL = function(canvas,attribs) {
	var _g = 0;
	var _g1 = ["webgl","experimental-webgl"];
	while(_g < _g1.length) {
		var name = _g1[_g];
		++_g;
		var ctx = canvas.getContext(name,attribs);
		if(ctx != null) return ctx;
	}
	return null;
};
var js_html_compat_ArrayBuffer = function(a) {
	if((a instanceof Array) && a.__enum__ == null) {
		this.a = a;
		this.byteLength = a.length;
	} else {
		var len = a;
		this.a = [];
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.a[i] = 0;
		}
		this.byteLength = len;
	}
};
$hxClasses["js.html.compat.ArrayBuffer"] = js_html_compat_ArrayBuffer;
js_html_compat_ArrayBuffer.__name__ = true;
js_html_compat_ArrayBuffer.sliceImpl = function(begin,end) {
	var u = new Uint8Array(this,begin,end == null?null:end - begin);
	var result = new ArrayBuffer(u.byteLength);
	var resultArray = new Uint8Array(result);
	resultArray.set(u);
	return result;
};
js_html_compat_ArrayBuffer.prototype = {
	slice: function(begin,end) {
		return new js_html_compat_ArrayBuffer(this.a.slice(begin,end));
	}
	,__class__: js_html_compat_ArrayBuffer
};
var js_html_compat_DataView = function(buffer,byteOffset,byteLength) {
	this.buf = buffer;
	this.offset = byteOffset == null?0:byteOffset;
	this.length = byteLength == null?buffer.byteLength - this.offset:byteLength;
	if(this.offset < 0 || this.length < 0 || this.offset + this.length > buffer.byteLength) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
};
$hxClasses["js.html.compat.DataView"] = js_html_compat_DataView;
js_html_compat_DataView.__name__ = true;
js_html_compat_DataView.prototype = {
	getInt8: function(byteOffset) {
		var v = this.buf.a[this.offset + byteOffset];
		return v >= 128?v - 256:v;
	}
	,getUint8: function(byteOffset) {
		return this.buf.a[this.offset + byteOffset];
	}
	,getInt16: function(byteOffset,littleEndian) {
		var v = this.getUint16(byteOffset,littleEndian);
		return v >= 32768?v - 65536:v;
	}
	,getUint16: function(byteOffset,littleEndian) {
		return littleEndian?this.buf.a[this.offset + byteOffset] | this.buf.a[this.offset + byteOffset + 1] << 8:this.buf.a[this.offset + byteOffset] << 8 | this.buf.a[this.offset + byteOffset + 1];
	}
	,getInt32: function(byteOffset,littleEndian) {
		var p = this.offset + byteOffset;
		var a = this.buf.a[p++];
		var b = this.buf.a[p++];
		var c = this.buf.a[p++];
		var d = this.buf.a[p++];
		return littleEndian?a | b << 8 | c << 16 | d << 24:d | c << 8 | b << 16 | a << 24;
	}
	,getUint32: function(byteOffset,littleEndian) {
		var v = this.getInt32(byteOffset,littleEndian);
		return v < 0?v + 4294967296.:v;
	}
	,getFloat32: function(byteOffset,littleEndian) {
		return haxe_io_FPHelper.i32ToFloat(this.getInt32(byteOffset,littleEndian));
	}
	,getFloat64: function(byteOffset,littleEndian) {
		var a = this.getInt32(byteOffset,littleEndian);
		var b = this.getInt32(byteOffset + 4,littleEndian);
		return haxe_io_FPHelper.i64ToDouble(littleEndian?a:b,littleEndian?b:a);
	}
	,setInt8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value < 0?value + 128 & 255:value & 255;
	}
	,setUint8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setInt16: function(byteOffset,value,littleEndian) {
		this.setUint16(byteOffset,value < 0?value + 65536:value,littleEndian);
	}
	,setUint16: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
		} else {
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p] = value & 255;
		}
	}
	,setInt32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,value,littleEndian);
	}
	,setUint32: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p++] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >>> 24;
		} else {
			this.buf.a[p++] = value >>> 24;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value & 255;
		}
	}
	,setFloat32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,haxe_io_FPHelper.floatToI32(value),littleEndian);
	}
	,setFloat64: function(byteOffset,value,littleEndian) {
		var i64 = haxe_io_FPHelper.doubleToI64(value);
		if(littleEndian) {
			this.setUint32(byteOffset,i64.low);
			this.setUint32(byteOffset,i64.high);
		} else {
			this.setUint32(byteOffset,i64.high);
			this.setUint32(byteOffset,i64.low);
		}
	}
	,__class__: js_html_compat_DataView
};
var js_html_compat_Uint8Array = function() { };
$hxClasses["js.html.compat.Uint8Array"] = js_html_compat_Uint8Array;
js_html_compat_Uint8Array.__name__ = true;
js_html_compat_Uint8Array._new = function(arg1,offset,length) {
	var arr;
	if(typeof(arg1) == "number") {
		arr = [];
		var _g = 0;
		while(_g < arg1) {
			var i = _g++;
			arr[i] = 0;
		}
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else if(js_Boot.__instanceof(arg1,js_html_compat_ArrayBuffer)) {
		var buffer = arg1;
		if(offset == null) offset = 0;
		if(length == null) length = buffer.byteLength - offset;
		if(offset == 0) arr = buffer.a; else arr = buffer.a.slice(offset,offset + length);
		arr.byteLength = arr.length;
		arr.byteOffset = offset;
		arr.buffer = buffer;
	} else if((arg1 instanceof Array) && arg1.__enum__ == null) {
		arr = arg1.slice();
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else throw new js__$Boot_HaxeError("TODO " + Std.string(arg1));
	arr.subarray = js_html_compat_Uint8Array._subarray;
	arr.set = js_html_compat_Uint8Array._set;
	return arr;
};
js_html_compat_Uint8Array._set = function(arg,offset) {
	var t = this;
	if(js_Boot.__instanceof(arg.buffer,js_html_compat_ArrayBuffer)) {
		var a = arg;
		if(arg.byteLength + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g1 = 0;
		var _g = arg.byteLength;
		while(_g1 < _g) {
			var i = _g1++;
			t[i + offset] = a[i];
		}
	} else if((arg instanceof Array) && arg.__enum__ == null) {
		var a1 = arg;
		if(a1.length + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g11 = 0;
		var _g2 = a1.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			t[i1 + offset] = a1[i1];
		}
	} else throw new js__$Boot_HaxeError("TODO");
};
js_html_compat_Uint8Array._subarray = function(start,end) {
	var t = this;
	var a = js_html_compat_Uint8Array._new(t.slice(start,end));
	a.byteOffset = start;
	return a;
};
var shaderblox_attributes_Attribute = function() { };
$hxClasses["shaderblox.attributes.Attribute"] = shaderblox_attributes_Attribute;
shaderblox_attributes_Attribute.__name__ = true;
shaderblox_attributes_Attribute.prototype = {
	__class__: shaderblox_attributes_Attribute
};
var shaderblox_attributes_FloatAttribute = function(name,location,nFloats) {
	if(nFloats == null) nFloats = 1;
	this.name = name;
	this.location = location;
	this.byteSize = nFloats * 4;
	this.itemCount = nFloats;
	this.type = 5126;
};
$hxClasses["shaderblox.attributes.FloatAttribute"] = shaderblox_attributes_FloatAttribute;
shaderblox_attributes_FloatAttribute.__name__ = true;
shaderblox_attributes_FloatAttribute.__super__ = shaderblox_attributes_Attribute;
shaderblox_attributes_FloatAttribute.prototype = $extend(shaderblox_attributes_Attribute.prototype,{
	__class__: shaderblox_attributes_FloatAttribute
});
var shaderblox_uniforms_IAppliable = function() { };
$hxClasses["shaderblox.uniforms.IAppliable"] = shaderblox_uniforms_IAppliable;
shaderblox_uniforms_IAppliable.__name__ = true;
shaderblox_uniforms_IAppliable.prototype = {
	__class__: shaderblox_uniforms_IAppliable
};
var shaderblox_uniforms_UniformBase_$Bool = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_Bool"] = shaderblox_uniforms_UniformBase_$Bool;
shaderblox_uniforms_UniformBase_$Bool.__name__ = true;
shaderblox_uniforms_UniformBase_$Bool.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$Bool
};
var shaderblox_uniforms_UBool = function(name,index,f) {
	if(f == null) f = false;
	shaderblox_uniforms_UniformBase_$Bool.call(this,name,index,f);
};
$hxClasses["shaderblox.uniforms.UBool"] = shaderblox_uniforms_UBool;
shaderblox_uniforms_UBool.__name__ = true;
shaderblox_uniforms_UBool.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UBool.__super__ = shaderblox_uniforms_UniformBase_$Bool;
shaderblox_uniforms_UBool.prototype = $extend(shaderblox_uniforms_UniformBase_$Bool.prototype,{
	apply: function() {
		snow_modules_opengl_web_GL.current_context.uniform1i(this.location,this.data?1:0);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UBool
});
var shaderblox_uniforms_UniformBase_$Float = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_Float"] = shaderblox_uniforms_UniformBase_$Float;
shaderblox_uniforms_UniformBase_$Float.__name__ = true;
shaderblox_uniforms_UniformBase_$Float.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$Float
};
var shaderblox_uniforms_UFloat = function(name,index,f) {
	if(f == null) f = 0.0;
	shaderblox_uniforms_UniformBase_$Float.call(this,name,index,f);
};
$hxClasses["shaderblox.uniforms.UFloat"] = shaderblox_uniforms_UFloat;
shaderblox_uniforms_UFloat.__name__ = true;
shaderblox_uniforms_UFloat.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UFloat.__super__ = shaderblox_uniforms_UniformBase_$Float;
shaderblox_uniforms_UFloat.prototype = $extend(shaderblox_uniforms_UniformBase_$Float.prototype,{
	apply: function() {
		snow_modules_opengl_web_GL.current_context.uniform1f(this.location,this.data);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UFloat
});
var shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_js_html_webgl_Texture"] = shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture;
shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture.__name__ = true;
shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture
};
var shaderblox_uniforms_UTexture = function(name,index,cube) {
	if(cube == null) cube = false;
	this.cube = cube;
	this.type = cube?34067:3553;
	shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture.call(this,name,index,null);
};
$hxClasses["shaderblox.uniforms.UTexture"] = shaderblox_uniforms_UTexture;
shaderblox_uniforms_UTexture.__name__ = true;
shaderblox_uniforms_UTexture.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UTexture.__super__ = shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture;
shaderblox_uniforms_UTexture.prototype = $extend(shaderblox_uniforms_UniformBase_$js_$html_$webgl_$Texture.prototype,{
	apply: function() {
		if(this.data == null) return;
		var idx = 33984 + this.samplerIndex;
		if(shaderblox_uniforms_UTexture.lastActiveTexture != idx) {
			var texture = shaderblox_uniforms_UTexture.lastActiveTexture = idx;
			snow_modules_opengl_web_GL.current_context.activeTexture(texture);
		}
		snow_modules_opengl_web_GL.current_context.uniform1i(this.location,this.samplerIndex);
		snow_modules_opengl_web_GL.current_context.bindTexture(this.type,this.data);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UTexture
});
var shaderblox_uniforms_Vector2 = function(x,y) {
	if(y == null) y = 0;
	if(x == null) x = 0;
	this.x = x;
	this.y = y;
};
$hxClasses["shaderblox.uniforms.Vector2"] = shaderblox_uniforms_Vector2;
shaderblox_uniforms_Vector2.__name__ = true;
shaderblox_uniforms_Vector2.prototype = {
	__class__: shaderblox_uniforms_Vector2
};
var shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2 = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_shaderblox_uniforms_Vector2"] = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2.__name__ = true;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2
};
var shaderblox_uniforms_UVec2 = function(name,index,x,y) {
	if(y == null) y = 0;
	if(x == null) x = 0;
	shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2.call(this,name,index,new shaderblox_uniforms_Vector2(x,y));
};
$hxClasses["shaderblox.uniforms.UVec2"] = shaderblox_uniforms_UVec2;
shaderblox_uniforms_UVec2.__name__ = true;
shaderblox_uniforms_UVec2.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UVec2.__super__ = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2;
shaderblox_uniforms_UVec2.prototype = $extend(shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector2.prototype,{
	apply: function() {
		snow_modules_opengl_web_GL.current_context.uniform2f(this.location,this.data.x,this.data.y);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UVec2
});
var shaderblox_uniforms_Vector3 = function(x,y,z) {
	if(z == null) z = 0;
	if(y == null) y = 0;
	if(x == null) x = 0;
	this.x = x;
	this.y = y;
	this.z = z;
};
$hxClasses["shaderblox.uniforms.Vector3"] = shaderblox_uniforms_Vector3;
shaderblox_uniforms_Vector3.__name__ = true;
shaderblox_uniforms_Vector3.prototype = {
	__class__: shaderblox_uniforms_Vector3
};
var shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3 = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_shaderblox_uniforms_Vector3"] = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3.__name__ = true;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3
};
var shaderblox_uniforms_UVec3 = function(name,index,x,y,z) {
	if(z == null) z = 0;
	if(y == null) y = 0;
	if(x == null) x = 0;
	shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3.call(this,name,index,new shaderblox_uniforms_Vector3(x,y,z));
};
$hxClasses["shaderblox.uniforms.UVec3"] = shaderblox_uniforms_UVec3;
shaderblox_uniforms_UVec3.__name__ = true;
shaderblox_uniforms_UVec3.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UVec3.__super__ = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3;
shaderblox_uniforms_UVec3.prototype = $extend(shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector3.prototype,{
	apply: function() {
		snow_modules_opengl_web_GL.current_context.uniform3f(this.location,this.data.x,this.data.y,this.data.z);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UVec3
});
var shaderblox_uniforms_Vector4 = function(x,y,z,w) {
	if(w == null) w = 0;
	if(z == null) z = 0;
	if(y == null) y = 0;
	if(x == null) x = 0;
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
};
$hxClasses["shaderblox.uniforms.Vector4"] = shaderblox_uniforms_Vector4;
shaderblox_uniforms_Vector4.__name__ = true;
shaderblox_uniforms_Vector4.prototype = {
	__class__: shaderblox_uniforms_Vector4
};
var shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4 = function(name,index,data) {
	this.name = name;
	this.location = index;
	this.dirty = true;
	this.data = data;
};
$hxClasses["shaderblox.uniforms.UniformBase_shaderblox_uniforms_Vector4"] = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4.__name__ = true;
shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4.prototype = {
	__class__: shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4
};
var shaderblox_uniforms_UVec4 = function(name,index,x,y,z,w) {
	if(w == null) w = 0;
	if(z == null) z = 0;
	if(y == null) y = 0;
	if(x == null) x = 0;
	shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4.call(this,name,index,new shaderblox_uniforms_Vector4(x,y,z,w));
};
$hxClasses["shaderblox.uniforms.UVec4"] = shaderblox_uniforms_UVec4;
shaderblox_uniforms_UVec4.__name__ = true;
shaderblox_uniforms_UVec4.__interfaces__ = [shaderblox_uniforms_IAppliable];
shaderblox_uniforms_UVec4.__super__ = shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4;
shaderblox_uniforms_UVec4.prototype = $extend(shaderblox_uniforms_UniformBase_$shaderblox_$uniforms_$Vector4.prototype,{
	apply: function() {
		snow_modules_opengl_web_GL.current_context.uniform4f(this.location,this.data.x,this.data.y,this.data.z,this.data.w);
		this.dirty = false;
	}
	,__class__: shaderblox_uniforms_UVec4
});
var snow_Snow = function() {
	this.is_ready = false;
	this.was_ready = false;
	this.has_shutdown = false;
	this.shutting_down = false;
	this.os = "unknown";
	this.platform = "unknown";
	this.freeze = false;
	this.platform = "web";
	snow_Snow.core = new snow_core_web_Core(this);
	snow_Snow.next_queue = [];
	snow_Snow.defer_queue = [];
};
$hxClasses["snow.Snow"] = snow_Snow;
snow_Snow.__name__ = true;
snow_Snow.prototype = {
	shutdown: function() {
		this.shutting_down = true;
		this.host.ondestroy();
		this.io.module.destroy();
		this.audio.destroy();
		this.input.destroy();
		this.windowing.destroy();
		snow_Snow.core.shutdown();
		this.has_shutdown = true;
	}
	,render: function() {
		this.windowing.update();
	}
	,dispatch_system_event: function(_event) {
		this.on_event(_event);
	}
	,init: function(_snow_config,_host) {
		this.snow_config = _snow_config;
		if(this.snow_config.app_package == null) this.snow_config.app_package = "org.snowkit.snow";
		if(this.snow_config.config_path == null) this.snow_config.config_path = "";
		this.config = this.default_config();
		this.host = _host;
		this.host.app = this;
		snow_Snow.core.init($bind(this,this.on_event));
	}
	,on_snow_init: function() {
		this.host.on_internal_init();
	}
	,on_snow_ready: function() {
		var _g = this;
		if(this.was_ready) throw new js__$Boot_HaxeError(snow_types_Error.error("firing ready event more than once is invalid usage"));
		this.io = new snow_system_io_IO(this);
		this.input = new snow_system_input_Input(this);
		this.audio = new snow_system_audio_Audio(this);
		this.assets = new snow_system_assets_Assets(this);
		this.windowing = new snow_system_window_Windowing(this);
		this.was_ready = true;
		this.setup_app_path();
		this.setup_configs().then(function(_) {
			_g.setup_default_window();
			var func = $bind(_g,_g.on_ready);
			if(func != null) snow_Snow.next_queue.push(func);
		}).error(function(e) {
			throw new js__$Boot_HaxeError(snow_types_Error.init("snow / cannot recover from error: " + e));
		});
		snow_api_Promises.step();
		while(snow_Snow.next_queue.length > 0) {
			var count = snow_Snow.next_queue.length;
			var i = 0;
			while(i < count) {
				(snow_Snow.next_queue.shift())();
				++i;
			}
		}
		while(snow_Snow.defer_queue.length > 0) {
			var count1 = snow_Snow.defer_queue.length;
			var i1 = 0;
			while(i1 < count1) {
				(snow_Snow.defer_queue.shift())();
				++i1;
			}
		}
	}
	,do_internal_update: function(dt) {
		this.io.module.update();
		this.input.update();
		this.audio.update();
		this.host.update(dt);
	}
	,on_ready: function() {
		this.is_ready = true;
		this.host.ready();
	}
	,on_snow_update: function() {
		if(this.freeze) return;
		snow_api_Timer.update();
		snow_api_Promises.step();
		var count = snow_Snow.next_queue.length;
		var i = 0;
		while(i < count) {
			(snow_Snow.next_queue.shift())();
			++i;
		}
		if(!this.is_ready) return;
		this.host.ontickstart();
		this.host.on_internal_update();
		this.host.on_internal_render();
		this.host.ontickend();
		var count1 = snow_Snow.defer_queue.length;
		var i1 = 0;
		while(i1 < count1) {
			(snow_Snow.defer_queue.shift())();
			++i1;
		}
	}
	,on_event: function(_event) {
		_event.type != 3 && _event.type != 0 && _event.type != 5 && _event.type != 6;
		if(this.is_ready) {
			this.io.module.on_event(_event);
			this.audio.on_event(_event);
			this.windowing.on_event(_event);
			this.input.on_event(_event);
		}
		this.host.onevent(_event);
		var _g = _event.type;
		if(_g != null) switch(_g) {
		case 1:
			this.on_snow_init();
			break;
		case 2:
			this.on_snow_ready();
			break;
		case 3:
			this.on_snow_update();
			break;
		case 7:case 8:
			this.shutdown();
			break;
		case 4:
			break;
		default:
		} else {
		}
	}
	,setup_app_path: function() {
	}
	,setup_configs: function() {
		var _g = this;
		if(this.snow_config.config_path == "") {
			this.setup_host_config();
			return snow_api_Promise.resolve();
		}
		return new snow_api_Promise(function(resolve,reject) {
			_g.default_runtime_config().then(function(_runtime_conf) {
				_g.config.runtime = _runtime_conf;
			}).error(function(error) {
				throw new js__$Boot_HaxeError(snow_types_Error.init("config / failed / default runtime config failed to parse as JSON. cannot recover. " + error));
			}).then(function() {
				_g.setup_host_config();
				resolve();
			});
		});
	}
	,setup_host_config: function() {
		this.config = this.host.config(this.config);
	}
	,setup_default_window: function() {
		if(this.config.has_window == true) {
			this.window = this.windowing.create(this.config.window);
			if(this.window.handle == null) throw new js__$Boot_HaxeError(snow_types_Error.windowing("requested default window cannot be created. cannot continue"));
		} else {
		}
	}
	,default_config: function() {
		return { has_window : true, runtime : { }, window : this.default_window_config(), render : this.default_render_config(), web : { no_context_menu : true, prevent_default_keys : [snow_system_input_Keycodes.left,snow_system_input_Keycodes.right,snow_system_input_Keycodes.up,snow_system_input_Keycodes.down,snow_system_input_Keycodes.backspace,snow_system_input_Keycodes.tab,snow_system_input_Keycodes["delete"]], prevent_default_mouse_wheel : true, true_fullscreen : false}, 'native' : { audio_buffer_length : 176400, audio_buffer_count : 4}};
	}
	,default_runtime_config: function() {
		var _g = this;
		return new snow_api_Promise(function(resolve,reject) {
			var load = _g.io.data_flow(haxe_io_Path.join([_g.assets.root,_g.snow_config.config_path]),snow_system_assets_AssetJSON.processor);
			load.then(resolve).error(function(error) {
				switch(error[1]) {
				case 3:
					reject(error);
					break;
				default:
					resolve();
				}
			});
		});
	}
	,default_render_config: function() {
		return { depth : false, stencil : false, antialiasing : 0, red_bits : 8, green_bits : 8, blue_bits : 8, alpha_bits : 8, depth_bits : 0, stencil_bits : 0, opengl : { minor : 0, major : 0, profile : 0}};
	}
	,default_window_config: function() {
		var conf = { fullscreen_desktop : true, fullscreen : true, borderless : false, resizable : true, x : 536805376, y : 536805376, width : 960, height : 640};
		return conf;
	}
	,__class__: snow_Snow
};
var snow_api_Promise = function(func) {
	this.was_caught = false;
	var _g = this;
	this.state = 0;
	this.reject_reactions = [];
	this.fulfill_reactions = [];
	this.settle_reactions = [];
	snow_api_Promises.queue(function() {
		func($bind(_g,_g.onfulfill),$bind(_g,_g.onreject));
		snow_api_Promises.defer(snow_api_Promises.next);
	});
};
$hxClasses["snow.api.Promise"] = snow_api_Promise;
snow_api_Promise.__name__ = true;
snow_api_Promise.reject = function(reason) {
	return new snow_api_Promise(function(ok,no) {
		no(reason);
	});
};
snow_api_Promise.resolve = function(val) {
	return new snow_api_Promise(function(ok,no) {
		ok(val);
	});
};
snow_api_Promise.prototype = {
	then: function(on_fulfilled,on_rejected) {
		var _g = this.state;
		switch(_g) {
		case 0:
			this.add_fulfill(on_fulfilled);
			this.add_reject(on_rejected);
			return this.new_linked_promise();
		case 1:
			snow_api_Promises.defer(on_fulfilled,this.result);
			return snow_api_Promise.resolve(this.result);
		case 2:
			snow_api_Promises.defer(on_rejected,this.result);
			return snow_api_Promise.reject(this.result);
		}
	}
	,error: function(on_rejected) {
		var _g = this.state;
		switch(_g) {
		case 0:
			this.add_reject(on_rejected);
			return this.new_linked_resolve_empty();
		case 1:
			return snow_api_Promise.resolve(this.result);
		case 2:
			snow_api_Promises.defer(on_rejected,this.result);
			return snow_api_Promise.reject(this.result);
		}
	}
	,add_settle: function(f) {
		if(this.state == 0) this.settle_reactions.push(f); else snow_api_Promises.defer(f,this.result);
	}
	,new_linked_promise: function() {
		var _g = this;
		return new snow_api_Promise(function(f,r) {
			_g.add_settle(function(_) {
				if(_g.state == 1) f(_g.result); else r(_g.result);
			});
		});
	}
	,new_linked_resolve_empty: function() {
		var _g = this;
		return new snow_api_Promise(function(f,r) {
			_g.add_settle(function(_) {
				f();
			});
		});
	}
	,add_fulfill: function(f) {
		if(f != null) this.fulfill_reactions.push(f);
	}
	,add_reject: function(f) {
		if(f != null) {
			this.was_caught = true;
			this.reject_reactions.push(f);
		}
	}
	,onfulfill: function(val) {
		this.state = 1;
		this.result = val;
		while(this.fulfill_reactions.length > 0) {
			var fn = this.fulfill_reactions.shift();
			fn(this.result);
		}
		this.onsettle();
	}
	,onreject: function(reason) {
		this.state = 2;
		this.result = reason;
		while(this.reject_reactions.length > 0) {
			var fn = this.reject_reactions.shift();
			fn(this.result);
		}
		this.onsettle();
	}
	,onsettle: function() {
		while(this.settle_reactions.length > 0) {
			var fn = this.settle_reactions.shift();
			fn(this.result);
		}
	}
	,__class__: snow_api_Promise
};
var snow_api_Promises = function() { };
$hxClasses["snow.api.Promises"] = snow_api_Promises;
snow_api_Promises.__name__ = true;
snow_api_Promises.step = function() {
	snow_api_Promises.next();
	while(snow_api_Promises.defers.length > 0) {
		var defer = snow_api_Promises.defers.shift();
		defer.f(defer.a);
	}
};
snow_api_Promises.next = function() {
	if(snow_api_Promises.calls.length > 0) (snow_api_Promises.calls.shift())();
};
snow_api_Promises.defer = function(f,a) {
	if(f == null) return;
	snow_api_Promises.defers.push({ f : f, a : a});
};
snow_api_Promises.queue = function(f) {
	if(f == null) return;
	snow_api_Promises.calls.push(f);
};
var snow_api_Timer = function() { };
$hxClasses["snow.api.Timer"] = snow_api_Timer;
snow_api_Timer.__name__ = true;
snow_api_Timer.update = function() {
	var now = snow_Snow.core.timestamp();
	var _g = 0;
	var _g1 = snow_api_Timer.running_timers;
	while(_g < _g1.length) {
		var timer = _g1[_g];
		++_g;
		if(timer.running) {
			if(timer.fire_at < now) {
				timer.fire_at += timer.time;
				timer.run();
			}
		}
	}
};
snow_api_Timer.prototype = {
	run: function() {
	}
	,__class__: snow_api_Timer
};
var snow_core_web_Core = function(_app) {
	this._time_now = 0.0;
	this._lf_timestamp = 0.016;
	this.start_timestamp = 0.0;
	this.app = _app;
	this.start_timestamp = this.timestamp();
	this.guess_os();
};
$hxClasses["snow.core.web.Core"] = snow_core_web_Core;
snow_core_web_Core.__name__ = true;
snow_core_web_Core.prototype = {
	init: function(_event_handler) {
		this.app.on_event({ type : 1});
		this.app.on_event({ type : 2});
		if(this.app.snow_config.has_loop) this.request_update();
	}
	,shutdown: function() {
	}
	,timestamp: function() {
		var now;
		if(window.performance != null) now = window.performance.now() / 1000.0; else now = haxe_Timer.stamp();
		return now - this.start_timestamp;
	}
	,request_update: function() {
		var _g = this;
		if(($_=window,$bind($_,$_.requestAnimationFrame)) != null) window.requestAnimationFrame($bind(this,this.snow_core_loop)); else window.setTimeout(function() {
			var _now = _g.timestamp();
			_g._time_now += _now - _g._lf_timestamp;
			_g.snow_core_loop(_g._time_now * 1000.0);
			_g._lf_timestamp = _now;
		},this.app.host.render_rate * 1000.0 | 0);
	}
	,snow_core_loop: function(_t) {
		if(_t == null) _t = 0.016;
		this.update();
		this.app.on_event({ type : 3});
		this.request_update();
		return true;
	}
	,update: function() {
	}
	,guess_os: function() {
		var _ver = window.navigator.appVersion;
		var _agent = window.navigator.userAgent;
		var tmp;
		var r = new EReg("mac","gi");
		tmp = r.match(_ver);
		if(tmp) this.app.os = "mac";
		var tmp1;
		var r1 = new EReg("win","gi");
		tmp1 = r1.match(_ver);
		if(tmp1) this.app.os = "windows";
		var tmp2;
		var r2 = new EReg("x11","gi");
		tmp2 = r2.match(_ver);
		if(tmp2) this.app.os = "linux";
		var tmp3;
		var r3 = new EReg("linux","gi");
		tmp3 = r3.match(_ver);
		if(tmp3) this.app.os = "linux";
		var tmp4;
		var r4 = new EReg("android","gi");
		tmp4 = r4.match(_ver);
		if(tmp4) this.app.os = "android";
		var tmp5;
		var r5 = new EReg("ipad","gi");
		tmp5 = r5.match(_agent);
		if(tmp5) this.app.os = "ios";
		var tmp6;
		var r6 = new EReg("iphone","gi");
		tmp6 = r6.match(_agent);
		if(tmp6) this.app.os = "ios";
		var tmp7;
		var r7 = new EReg("ipod","gi");
		tmp7 = r7.match(_agent);
		if(tmp7) this.app.os = "ios";
	}
	,__class__: snow_core_web_Core
};
var snow_modules_interfaces_Assets = function() { };
$hxClasses["snow.modules.interfaces.Assets"] = snow_modules_interfaces_Assets;
snow_modules_interfaces_Assets.__name__ = true;
var snow_core_web_assets_Assets = function(_system) {
	this.system = _system;
};
$hxClasses["snow.core.web.assets.Assets"] = snow_core_web_assets_Assets;
snow_core_web_assets_Assets.__name__ = true;
snow_core_web_assets_Assets.__interfaces__ = [snow_modules_interfaces_Assets];
snow_core_web_assets_Assets.prototype = {
	__class__: snow_core_web_assets_Assets
};
var snow_core_web_input_DOMKeys = function() { };
$hxClasses["snow.core.web.input.DOMKeys"] = snow_core_web_input_DOMKeys;
snow_core_web_input_DOMKeys.__name__ = true;
snow_core_web_input_DOMKeys.dom_key_to_keycode = function(_keycode) {
	switch(_keycode) {
	case 16:
		return snow_system_input_Keycodes.lshift;
	case 17:
		return snow_system_input_Keycodes.lctrl;
	case 18:
		return snow_system_input_Keycodes.lalt;
	case 20:
		return snow_system_input_Keycodes.capslock;
	case 33:
		return snow_system_input_Keycodes.pageup;
	case 34:
		return snow_system_input_Keycodes.pagedown;
	case 35:
		return snow_system_input_Keycodes.end;
	case 36:
		return snow_system_input_Keycodes.home;
	case 37:
		return snow_system_input_Keycodes.left;
	case 38:
		return snow_system_input_Keycodes.up;
	case 39:
		return snow_system_input_Keycodes.right;
	case 40:
		return snow_system_input_Keycodes.down;
	case 44:
		return snow_system_input_Keycodes.printscreen;
	case 45:
		return snow_system_input_Keycodes.insert;
	case 46:
		return snow_system_input_Keycodes["delete"];
	case 91:
		return snow_system_input_Keycodes.lmeta;
	case 93:
		return snow_system_input_Keycodes.rmeta;
	case 224:
		return snow_system_input_Keycodes.lmeta;
	case 96:
		return snow_system_input_Keycodes.kp_0;
	case 97:
		return snow_system_input_Keycodes.kp_1;
	case 98:
		return snow_system_input_Keycodes.kp_2;
	case 99:
		return snow_system_input_Keycodes.kp_3;
	case 100:
		return snow_system_input_Keycodes.kp_4;
	case 101:
		return snow_system_input_Keycodes.kp_5;
	case 102:
		return snow_system_input_Keycodes.kp_6;
	case 103:
		return snow_system_input_Keycodes.kp_7;
	case 104:
		return snow_system_input_Keycodes.kp_8;
	case 105:
		return snow_system_input_Keycodes.kp_9;
	case 106:
		return snow_system_input_Keycodes.kp_multiply;
	case 107:
		return snow_system_input_Keycodes.kp_plus;
	case 109:
		return snow_system_input_Keycodes.kp_minus;
	case 110:
		return snow_system_input_Keycodes.kp_decimal;
	case 111:
		return snow_system_input_Keycodes.kp_divide;
	case 144:
		return snow_system_input_Keycodes.numlockclear;
	case 112:
		return snow_system_input_Keycodes.f1;
	case 113:
		return snow_system_input_Keycodes.f2;
	case 114:
		return snow_system_input_Keycodes.f3;
	case 115:
		return snow_system_input_Keycodes.f4;
	case 116:
		return snow_system_input_Keycodes.f5;
	case 117:
		return snow_system_input_Keycodes.f6;
	case 118:
		return snow_system_input_Keycodes.f7;
	case 119:
		return snow_system_input_Keycodes.f8;
	case 120:
		return snow_system_input_Keycodes.f9;
	case 121:
		return snow_system_input_Keycodes.f10;
	case 122:
		return snow_system_input_Keycodes.f11;
	case 123:
		return snow_system_input_Keycodes.f12;
	case 124:
		return snow_system_input_Keycodes.f13;
	case 125:
		return snow_system_input_Keycodes.f14;
	case 126:
		return snow_system_input_Keycodes.f15;
	case 127:
		return snow_system_input_Keycodes.f16;
	case 128:
		return snow_system_input_Keycodes.f17;
	case 129:
		return snow_system_input_Keycodes.f18;
	case 130:
		return snow_system_input_Keycodes.f19;
	case 131:
		return snow_system_input_Keycodes.f20;
	case 132:
		return snow_system_input_Keycodes.f21;
	case 133:
		return snow_system_input_Keycodes.f22;
	case 134:
		return snow_system_input_Keycodes.f23;
	case 135:
		return snow_system_input_Keycodes.f24;
	case 160:
		return snow_system_input_Keycodes.caret;
	case 161:
		return snow_system_input_Keycodes.exclaim;
	case 162:
		return snow_system_input_Keycodes.quotedbl;
	case 163:
		return snow_system_input_Keycodes.hash;
	case 164:
		return snow_system_input_Keycodes.dollar;
	case 165:
		return snow_system_input_Keycodes.percent;
	case 166:
		return snow_system_input_Keycodes.ampersand;
	case 167:
		return snow_system_input_Keycodes.underscore;
	case 168:
		return snow_system_input_Keycodes.leftparen;
	case 169:
		return snow_system_input_Keycodes.rightparen;
	case 170:
		return snow_system_input_Keycodes.asterisk;
	case 171:
		return snow_system_input_Keycodes.plus;
	case 172:
		return snow_system_input_Keycodes.backslash;
	case 173:
		return snow_system_input_Keycodes.minus;
	case 174:
		return snow_system_input_Keycodes.leftbracket;
	case 175:
		return snow_system_input_Keycodes.rightbracket;
	case 176:
		return snow_system_input_Keycodes.backquote;
	case 181:
		return snow_system_input_Keycodes.audiomute;
	case 182:
		return snow_system_input_Keycodes.volumedown;
	case 183:
		return snow_system_input_Keycodes.volumeup;
	case 188:
		return snow_system_input_Keycodes.comma;
	case 190:
		return snow_system_input_Keycodes.period;
	case 191:
		return snow_system_input_Keycodes.slash;
	case 192:
		return snow_system_input_Keycodes.backquote;
	case 219:
		return snow_system_input_Keycodes.leftbracket;
	case 221:
		return snow_system_input_Keycodes.rightbracket;
	case 220:
		return snow_system_input_Keycodes.backslash;
	case 222:
		return snow_system_input_Keycodes.quote;
	}
	return _keycode;
};
var snow_modules_interfaces_Input = function() { };
$hxClasses["snow.modules.interfaces.Input"] = snow_modules_interfaces_Input;
snow_modules_interfaces_Input.__name__ = true;
var snow_system_input_Scancodes = function() { };
$hxClasses["snow.system.input.Scancodes"] = snow_system_input_Scancodes;
snow_system_input_Scancodes.__name__ = true;
var snow_system_input_Keycodes = function() { };
$hxClasses["snow.system.input.Keycodes"] = snow_system_input_Keycodes;
snow_system_input_Keycodes.__name__ = true;
snow_system_input_Keycodes.from_scan = function(scancode) {
	return scancode | snow_system_input_Scancodes.MASK;
};
snow_system_input_Keycodes.to_scan = function(keycode) {
	if((keycode & snow_system_input_Scancodes.MASK) != 0) return keycode & ~snow_system_input_Scancodes.MASK;
	switch(keycode) {
	case 13:
		return snow_system_input_Scancodes.enter;
	case 27:
		return snow_system_input_Scancodes.escape;
	case 8:
		return snow_system_input_Scancodes.backspace;
	case 9:
		return snow_system_input_Scancodes.tab;
	case 32:
		return snow_system_input_Scancodes.space;
	case 47:
		return snow_system_input_Scancodes.slash;
	case 48:
		return snow_system_input_Scancodes.key_0;
	case 49:
		return snow_system_input_Scancodes.key_1;
	case 50:
		return snow_system_input_Scancodes.key_2;
	case 51:
		return snow_system_input_Scancodes.key_3;
	case 52:
		return snow_system_input_Scancodes.key_4;
	case 53:
		return snow_system_input_Scancodes.key_5;
	case 54:
		return snow_system_input_Scancodes.key_6;
	case 55:
		return snow_system_input_Scancodes.key_7;
	case 56:
		return snow_system_input_Scancodes.key_8;
	case 57:
		return snow_system_input_Scancodes.key_9;
	case 59:
		return snow_system_input_Scancodes.semicolon;
	case 61:
		return snow_system_input_Scancodes.equals;
	case 91:
		return snow_system_input_Scancodes.leftbracket;
	case 92:
		return snow_system_input_Scancodes.backslash;
	case 93:
		return snow_system_input_Scancodes.rightbracket;
	case 96:
		return snow_system_input_Scancodes.grave;
	case 97:
		return snow_system_input_Scancodes.key_a;
	case 98:
		return snow_system_input_Scancodes.key_b;
	case 99:
		return snow_system_input_Scancodes.key_c;
	case 100:
		return snow_system_input_Scancodes.key_d;
	case 101:
		return snow_system_input_Scancodes.key_e;
	case 102:
		return snow_system_input_Scancodes.key_f;
	case 103:
		return snow_system_input_Scancodes.key_g;
	case 104:
		return snow_system_input_Scancodes.key_h;
	case 105:
		return snow_system_input_Scancodes.key_i;
	case 106:
		return snow_system_input_Scancodes.key_j;
	case 107:
		return snow_system_input_Scancodes.key_k;
	case 108:
		return snow_system_input_Scancodes.key_l;
	case 109:
		return snow_system_input_Scancodes.key_m;
	case 110:
		return snow_system_input_Scancodes.key_n;
	case 111:
		return snow_system_input_Scancodes.key_o;
	case 112:
		return snow_system_input_Scancodes.key_p;
	case 113:
		return snow_system_input_Scancodes.key_q;
	case 114:
		return snow_system_input_Scancodes.key_r;
	case 115:
		return snow_system_input_Scancodes.key_s;
	case 116:
		return snow_system_input_Scancodes.key_t;
	case 117:
		return snow_system_input_Scancodes.key_u;
	case 118:
		return snow_system_input_Scancodes.key_v;
	case 119:
		return snow_system_input_Scancodes.key_w;
	case 120:
		return snow_system_input_Scancodes.key_x;
	case 121:
		return snow_system_input_Scancodes.key_y;
	case 122:
		return snow_system_input_Scancodes.key_z;
	}
	return snow_system_input_Scancodes.unknown;
};
var snow_core_web_input_Input = function(_system) {
	this.gamepads_supported = false;
	this.system = _system;
};
$hxClasses["snow.core.web.input.Input"] = snow_core_web_input_Input;
snow_core_web_input_Input.__name__ = true;
snow_core_web_input_Input.__interfaces__ = [snow_modules_interfaces_Input];
snow_core_web_input_Input.prototype = {
	init: function() {
		window.document.addEventListener("keypress",$bind(this,this.on_keypress));
		window.document.addEventListener("keydown",$bind(this,this.on_keydown));
		window.document.addEventListener("keyup",$bind(this,this.on_keyup));
		this.active_gamepads = new haxe_ds_IntMap();
		this.gamepads_supported = this.get_gamepad_list() != null;
		if(window.DeviceOrientationEvent) {
			window.addEventListener("deviceorientation",$bind(this,this.on_orientation));
			window.addEventListener("devicemotion",$bind(this,this.on_motion));
		}
		null;
	}
	,update: function() {
		if(this.gamepads_supported) this.poll_gamepads();
	}
	,destroy: function() {
	}
	,listen: function(window) {
		window.handle.addEventListener("contextmenu",$bind(this,this.on_contextmenu));
		window.handle.addEventListener("mousedown",$bind(this,this.on_mousedown));
		window.handle.addEventListener("mouseup",$bind(this,this.on_mouseup));
		window.handle.addEventListener("mousemove",$bind(this,this.on_mousemove));
		window.handle.addEventListener("mousewheel",$bind(this,this.on_mousewheel));
		window.handle.addEventListener("wheel",$bind(this,this.on_mousewheel));
		window.handle.addEventListener("touchstart",$bind(this,this.on_touchdown));
		window.handle.addEventListener("touchend",$bind(this,this.on_touchup));
		window.handle.addEventListener("touchmove",$bind(this,this.on_touchmove));
	}
	,on_event: function(_event) {
	}
	,on_orientation: function(event) {
		this.system.app.dispatch_system_event({ type : 6, input : { type : 4, timestamp : snow_Snow.core.timestamp(), event : { type : "orientation", alpha : event.alpha, beta : event.beta, gamma : event.gamma}}});
	}
	,on_motion: function(event) {
		this.system.app.dispatch_system_event({ type : 6, input : { type : 4, timestamp : snow_Snow.core.timestamp(), event : { type : "motion", acceleration : event.acceleration, accelerationIncludingGravity : event.accelerationIncludingGravity, rotationRate : event.rotationRate}}});
	}
	,poll_gamepads: function() {
		if(!this.gamepads_supported) return;
		var list = this.get_gamepad_list();
		if(list != null) {
			var _g1 = 0;
			var _g = list.length;
			while(_g1 < _g) {
				var i = _g1++;
				if(list[i] != null) this.handle_gamepad(list[i]); else {
					var _gamepad = this.active_gamepads.h[i];
					if(_gamepad != null) this.system.dispatch_gamepad_device_event(_gamepad.index,_gamepad.id,2,snow_Snow.core.timestamp());
					this.active_gamepads.remove(i);
				}
			}
		}
	}
	,handle_gamepad: function(_gamepad) {
		if(_gamepad == null) return;
		var tmp;
		var key = _gamepad.index;
		tmp = this.active_gamepads.h.hasOwnProperty(key);
		if(!tmp) {
			var _new_gamepad = { id : _gamepad.id, index : _gamepad.index, axes : [], buttons : [], timestamp : snow_Snow.core.timestamp()};
			var axes = _gamepad.axes;
			var _g = 0;
			while(_g < axes.length) {
				var value = axes[_g];
				++_g;
				_new_gamepad.axes.push(value);
			}
			var _button_list = _gamepad.buttons;
			var _g1 = 0;
			while(_g1 < _button_list.length) {
				++_g1;
				_new_gamepad.buttons.push({ pressed : false, value : 0});
			}
			this.active_gamepads.h[_new_gamepad.index] = _new_gamepad;
			this.system.dispatch_gamepad_device_event(_new_gamepad.index,_new_gamepad.id,1,_new_gamepad.timestamp);
		} else {
			var tmp1;
			var key1 = _gamepad.index;
			tmp1 = this.active_gamepads.h[key1];
			var gamepad = tmp1;
			if(gamepad.id != _gamepad.id) gamepad.id = _gamepad.id;
			var axes_changed = [];
			var buttons_changed = [];
			var last_axes = gamepad.axes;
			var last_buttons = gamepad.buttons;
			var new_axes = _gamepad.axes;
			var new_buttons = _gamepad.buttons;
			var axis_index = 0;
			var _g2 = 0;
			while(_g2 < new_axes.length) {
				var axis = new_axes[_g2];
				++_g2;
				if(axis != last_axes[axis_index]) {
					axes_changed.push(axis_index);
					gamepad.axes[axis_index] = axis;
				}
				axis_index++;
			}
			var button_index = 0;
			var _g3 = 0;
			while(_g3 < new_buttons.length) {
				var button = new_buttons[_g3];
				++_g3;
				if(button.value != last_buttons[button_index].value) {
					buttons_changed.push(button_index);
					gamepad.buttons[button_index].pressed = button.pressed;
					gamepad.buttons[button_index].value = button.value;
				}
				button_index++;
			}
			var _g4 = 0;
			while(_g4 < axes_changed.length) {
				var index = axes_changed[_g4];
				++_g4;
				this.system.dispatch_gamepad_axis_event(gamepad.index,index,new_axes[index],gamepad.timestamp);
			}
			var _g5 = 0;
			while(_g5 < buttons_changed.length) {
				var index1 = buttons_changed[_g5];
				++_g5;
				if(new_buttons[index1].pressed == true) this.system.dispatch_gamepad_button_down_event(gamepad.index,index1,new_buttons[index1].value,gamepad.timestamp); else this.system.dispatch_gamepad_button_up_event(gamepad.index,index1,new_buttons[index1].value,gamepad.timestamp);
			}
		}
	}
	,fail_gamepads: function() {
		this.gamepads_supported = false;
	}
	,get_gamepad_list: function() {
		if(($_=window.navigator,$bind($_,$_.getGamepads)) != null) return window.navigator.getGamepads();
		if(window.navigator.webkitGetGamepads != null) return window.navigator.webkitGetGamepads();
		this.fail_gamepads();
		return null;
	}
	,on_mousedown: function(_mouse_event) {
		var _window = this.system.app.windowing.window_from_handle(_mouse_event.target);
		this.system.dispatch_mouse_down_event(_mouse_event.pageX - window.pageXOffset - _window.x,_mouse_event.pageY - window.pageYOffset - _window.y,_mouse_event.button + 1,_mouse_event.timeStamp,_window.id);
	}
	,on_mouseup: function(_mouse_event) {
		var _window = this.system.app.windowing.window_from_handle(_mouse_event.target);
		this.system.dispatch_mouse_up_event(_mouse_event.pageX - window.pageXOffset - _window.x,_mouse_event.pageY - window.pageYOffset - _window.y,_mouse_event.button + 1,_mouse_event.timeStamp,_window.id);
	}
	,on_mousemove: function(_mouse_event) {
		var _window = this.system.app.windowing.window_from_handle(_mouse_event.target);
		var _movement_x = _mouse_event.movementX;
		var _movement_y = _mouse_event.movementY;
		if(_movement_x == null) {
			if(_mouse_event.webkitMovementX != null) {
				_movement_x = _mouse_event.webkitMovementX;
				_movement_y = _mouse_event.webkitMovementY;
			} else if(_mouse_event.mozMovementX != null) {
				_movement_x = _mouse_event.mozMovementX;
				_movement_y = _mouse_event.mozMovementY;
			}
		}
		this.system.dispatch_mouse_move_event(_mouse_event.pageX - window.pageXOffset - _window.x,_mouse_event.pageY - window.pageYOffset - _window.y,_movement_x,_movement_y,_mouse_event.timeStamp,_window.id);
	}
	,on_mousewheel: function(_wheel_event) {
		if(this.system.app.config.web.prevent_default_mouse_wheel) _wheel_event.preventDefault();
		var _window = this.system.app.windowing.window_from_handle(_wheel_event.target);
		var _x = 0;
		var _y = 0;
		if(_wheel_event.deltaY != null) _y = _wheel_event.deltaY; else if(_wheel_event.wheelDeltaY != null) _y = -_wheel_event.wheelDeltaY / 3 | 0;
		if(_wheel_event.deltaX != null) _x = _wheel_event.deltaX; else if(_wheel_event.wheelDeltaX != null) _x = -_wheel_event.wheelDeltaX / 3 | 0;
		this.system.dispatch_mouse_wheel_event(Math.round(_x / 16),Math.round(_y / 16),_wheel_event.timeStamp,_window.id);
	}
	,on_contextmenu: function(_event) {
		if(this.system.app.config.web.no_context_menu) _event.preventDefault();
	}
	,on_keypress: function(_key_event) {
		if(_key_event.which != 0 && HxOverrides.indexOf(snow_core_web_input_Input._keypress_blacklist,_key_event.keyCode,0) == -1) {
			var _text = String.fromCharCode(_key_event.charCode);
			this.system.dispatch_text_event(_text,0,_text.length,2,_key_event.timeStamp,1);
		}
	}
	,on_keydown: function(_key_event) {
		var _keycode = this.convert_keycode(_key_event.keyCode);
		var _scancode = snow_system_input_Keycodes.to_scan(_keycode);
		var _mod_state = this.mod_state_from_event(_key_event);
		if(HxOverrides.indexOf(this.system.app.config.web.prevent_default_keys,_keycode,0) != -1) _key_event.preventDefault();
		this.system.dispatch_key_down_event(_keycode,_scancode,_key_event.repeat,_mod_state,_key_event.timeStamp,1);
	}
	,on_keyup: function(_key_event) {
		var _keycode = this.convert_keycode(_key_event.keyCode);
		var _scancode = snow_system_input_Keycodes.to_scan(_keycode);
		var _mod_state = this.mod_state_from_event(_key_event);
		if(HxOverrides.indexOf(this.system.app.config.web.prevent_default_keys,_keycode,0) != -1) _key_event.preventDefault();
		this.system.dispatch_key_up_event(_keycode,_scancode,_key_event.repeat,_mod_state,_key_event.timeStamp,1);
	}
	,mod_state_from_event: function(_key_event) {
		var _none = !_key_event.altKey && !_key_event.ctrlKey && !_key_event.metaKey && !_key_event.shiftKey;
		return { none : _none, lshift : _key_event.shiftKey, rshift : _key_event.shiftKey, lctrl : _key_event.ctrlKey, rctrl : _key_event.ctrlKey, lalt : _key_event.altKey, ralt : _key_event.altKey, lmeta : _key_event.metaKey, rmeta : _key_event.metaKey, num : false, caps : false, mode : false, ctrl : _key_event.ctrlKey, shift : _key_event.shiftKey, alt : _key_event.altKey, meta : _key_event.metaKey};
	}
	,convert_keycode: function(dom_keycode) {
		if(dom_keycode >= 65 && dom_keycode <= 90) return dom_keycode + 32;
		return snow_core_web_input_DOMKeys.dom_key_to_keycode(dom_keycode);
	}
	,on_touchdown: function(_touch_event) {
		var _window = this.system.app.windowing.window_from_handle(_touch_event.target);
		var _g = 0;
		var _g1 = _touch_event.changedTouches;
		while(_g < _g1.length) {
			var touch = _g1[_g];
			++_g;
			var _x = touch.pageX - window.pageXOffset - _window.x;
			var _y = touch.pageY - window.pageYOffset - _window.y;
			_x = _x / _window.width;
			_y = _y / _window.height;
			this.system.dispatch_touch_down_event(_x,_y,touch.identifier,snow_Snow.core.timestamp());
		}
	}
	,on_touchup: function(_touch_event) {
		var _window = this.system.app.windowing.window_from_handle(_touch_event.target);
		var _g = 0;
		var _g1 = _touch_event.changedTouches;
		while(_g < _g1.length) {
			var touch = _g1[_g];
			++_g;
			var _x = touch.pageX - window.pageXOffset - _window.x;
			var _y = touch.pageY - window.pageYOffset - _window.y;
			_x = _x / _window.width;
			_y = _y / _window.height;
			this.system.dispatch_touch_up_event(_x,_y,touch.identifier,snow_Snow.core.timestamp());
		}
	}
	,on_touchmove: function(_touch_event) {
		var _window = this.system.app.windowing.window_from_handle(_touch_event.target);
		var _g = 0;
		var _g1 = _touch_event.changedTouches;
		while(_g < _g1.length) {
			var touch = _g1[_g];
			++_g;
			var _x = touch.pageX - window.pageXOffset - _window.x;
			var _y = touch.pageY - window.pageYOffset - _window.y;
			_x = _x / _window.width;
			_y = _y / _window.height;
			this.system.dispatch_touch_move_event(_x,_y,0,0,touch.identifier,snow_Snow.core.timestamp());
		}
	}
	,__class__: snow_core_web_input_Input
};
var snow_modules_interfaces_IO = function() { };
$hxClasses["snow.modules.interfaces.IO"] = snow_modules_interfaces_IO;
snow_modules_interfaces_IO.__name__ = true;
var snow_core_web_io_IO = function(_system) {
	this.system = _system;
};
$hxClasses["snow.core.web.io.IO"] = snow_core_web_io_IO;
snow_core_web_io_IO.__name__ = true;
snow_core_web_io_IO.__interfaces__ = [snow_modules_interfaces_IO];
snow_core_web_io_IO.prototype = {
	data_load: function(_path,_options) {
		return new snow_api_Promise(function(resolve,reject) {
			var _async = true;
			var _binary = true;
			if(_options != null) {
				if(_options.binary != null) _binary = _options.binary;
			}
			var request = new XMLHttpRequest();
			request.open("GET",_path,_async);
			if(_binary) request.overrideMimeType("text/plain; charset=x-user-defined"); else request.overrideMimeType("text/plain; charset=UTF-8");
			if(_async) request.responseType = "arraybuffer";
			request.onload = function(data) {
				if(request.status == 200) {
					var tmp;
					var elements = request.response;
					var this1;
					if(elements != null) this1 = new Uint8Array(elements); else this1 = null;
					tmp = this1;
					resolve(tmp);
				} else reject(snow_types_Error.error("request status was " + request.status + " / " + request.statusText));
			};
			request.send();
		});
	}
	,init: function() {
	}
	,update: function() {
	}
	,destroy: function() {
	}
	,on_event: function(_event) {
	}
	,__class__: snow_core_web_io_IO
};
var snow_modules_interfaces_Windowing = function() { };
$hxClasses["snow.modules.interfaces.Windowing"] = snow_modules_interfaces_Windowing;
snow_modules_interfaces_Windowing.__name__ = true;
var snow_core_web_window_Windowing = function(_system) {
	this._hidden_event_name = "";
	this._hidden_name = "";
	this._pre_fs_body_margin = "0";
	this._pre_fs_body_overflow = "0";
	this._pre_fs_height = 0;
	this._pre_fs_width = 0;
	this._pre_fs_s_height = "";
	this._pre_fs_s_width = "";
	this._pre_fs_margin = "0";
	this._pre_fs_padding = "0";
	this.seq_window = 1;
	this.system = _system;
	this.fs_windows = [];
	this.gl_contexts = new haxe_ds_IntMap();
};
$hxClasses["snow.core.web.window.Windowing"] = snow_core_web_window_Windowing;
snow_core_web_window_Windowing.__name__ = true;
snow_core_web_window_Windowing.__interfaces__ = [snow_modules_interfaces_Windowing];
snow_core_web_window_Windowing.prototype = {
	init: function() {
		this.listen_for_visibility();
		this.listen_for_resize();
	}
	,update: function() {
	}
	,destroy: function() {
	}
	,_copy_config: function(_config) {
		return { borderless : _config.borderless, fullscreen : _config.fullscreen, fullscreen_desktop : _config.fullscreen_desktop, height : _config.height, no_input : _config.no_input, resizable : _config.resizable, title : _config.title, width : _config.width, x : _config.x, y : _config.y};
	}
	,create: function(render_config,_config,on_created) {
		var _window_id = this.seq_window;
		var tmp;
		var _this = window.document;
		tmp = _this.createElement("canvas");
		var _handle = tmp;
		var config = this._copy_config(_config);
		_handle.width = config.width;
		_handle.height = config.height;
		_handle.style.display = "block";
		_handle.style.position = "absolute";
		_handle.style.top = "0px";
		_handle.style.background = "#000";
		window.document.body.appendChild(_handle);
		var _gl_context = js_html__$CanvasElement_CanvasUtil.getContextWebGL(_handle,{ alpha : false, premultipliedAlpha : false, antialias : render_config.antialiasing > 0});
		if(_gl_context == null) {
			var msg = "WebGL is required to run this!<br/><br/>";
			msg += "visit http://get.webgl.org/ for help <br/>";
			msg += "and contact the developer of the application";
			this.internal_fallback(msg);
			throw new js__$Boot_HaxeError(snow_types_Error.windowing(msg));
		}
		if(snow_modules_opengl_web_GL.current_context == null) snow_modules_opengl_web_GL.current_context = _gl_context;
		this.gl_contexts.h[_window_id] = _gl_context;
		var _window_pos = this.get_real_window_position(_handle);
		config.x = _window_pos.x;
		config.y = _window_pos.y;
		if(config.title != null && config.title != "") window.document.title = config.title;
		on_created(_handle,_window_id,{ config : config, render_config : render_config});
		_handle.setAttribute("id","window" + _window_id);
		this.seq_window++;
	}
	,internal_resize: function(_window,_w,_h) {
		this.system.app.dispatch_system_event({ type : 5, window : { type : 7, timestamp : snow_Snow.core.timestamp(), window_id : _window.id, event : { x : _w, y : _h}}});
		this.system.app.dispatch_system_event({ type : 5, window : { type : 6, timestamp : snow_Snow.core.timestamp(), window_id : _window.id, event : { x : _w, y : _h}}});
	}
	,update_window: function(_window) {
		var _rect = _window.handle.getBoundingClientRect();
		if(_rect.left != _window.x || _rect.top != _window.y) {
			var _event = { type : 5, window : { type : 5, timestamp : snow_Snow.core.timestamp(), window_id : _window.id, event : { x : _rect.left, y : _rect.top}}};
			this.system.app.on_event(_event);
		}
		if(_rect.width != _window.width || _rect.height != _window.height) this.internal_resize(_window,_rect.width,_rect.height);
		null;
	}
	,render: function(_window) {
		var _window_gl_context = this.gl_contexts.h[_window.id];
		if(snow_modules_opengl_web_GL.current_context != _window_gl_context) snow_modules_opengl_web_GL.current_context = _window_gl_context;
	}
	,swap: function(_window) {
	}
	,set_size: function(_window,w,h) {
		_window.handle.width = w;
		_window.handle.height = h;
		_window.handle.style.width = "" + w + "px";
		_window.handle.style.height = "" + h + "px";
		this.internal_resize(_window,w,h);
	}
	,set_position: function(_window,x,y) {
		_window.handle.style.left = "" + x + "px";
		_window.handle.style.top = "" + y + "px";
	}
	,get_real_window_position: function(handle) {
		var curleft = 0;
		var curtop = 0;
		var _obj = handle;
		var _has_parent = true;
		var _max_count = 0;
		while(_has_parent == true) {
			_max_count++;
			if(_max_count > 100) {
				_has_parent = false;
				break;
			}
			if(_obj.offsetParent != null) {
				curleft += _obj.offsetLeft;
				curtop += _obj.offsetTop;
				_obj = _obj.offsetParent;
			} else _has_parent = false;
		}
		return { x : curleft, y : curtop};
	}
	,set_max_size: function(_window,w,h) {
		_window.handle.style.maxWidth = "" + w + "px";
		_window.handle.style.maxHeight = "" + h + "px";
	}
	,set_min_size: function(_window,w,h) {
		_window.handle.style.minWidth = "" + w + "px";
		_window.handle.style.minHeight = "" + h + "px";
	}
	,internal_fullscreen: function(_window,fullscreen) {
		var _handle = _window.handle;
		if(fullscreen) {
			if(HxOverrides.indexOf(this.fs_windows,_window,0) == -1) this.fs_windows.push(_window);
		} else HxOverrides.remove(this.fs_windows,_window);
		var true_fullscreen = this.system.app.config.web.true_fullscreen;
		if(fullscreen) {
			if(true_fullscreen) {
				if($bind(_handle,_handle.requestFullscreen) == null) {
					if(_handle.requestFullScreen == null) {
						if(_handle.webkitRequestFullscreen == null) {
							if(_handle.mozRequestFullScreen == null) {
							} else _handle.mozRequestFullScreen();
						} else _handle.webkitRequestFullscreen();
					} else _handle.requestFullScreen(null);
				} else _handle.requestFullscreen();
			} else {
				this._pre_fs_padding = _handle.style.padding;
				this._pre_fs_margin = _handle.style.margin;
				this._pre_fs_s_width = _handle.style.width;
				this._pre_fs_s_height = _handle.style.height;
				this._pre_fs_width = _handle.width;
				this._pre_fs_height = _handle.height;
				this._pre_fs_body_margin = window.document.body.style.margin;
				this._pre_fs_body_overflow = window.document.body.style.overflow;
				_handle.style.margin = "0";
				_handle.style.padding = "0";
				_handle.style.width = window.innerWidth + "px";
				_handle.style.height = window.innerHeight + "px";
				_handle.width = window.innerWidth;
				_handle.height = window.innerHeight;
				window.document.body.style.margin = "0";
				window.document.body.style.overflow = "hidden";
			}
		} else if(true_fullscreen) {
		} else {
			_handle.style.padding = this._pre_fs_padding;
			_handle.style.margin = this._pre_fs_margin;
			_handle.style.width = this._pre_fs_s_width;
			_handle.style.height = this._pre_fs_s_height;
			_handle.width = this._pre_fs_width;
			_handle.height = this._pre_fs_height;
			window.document.body.style.margin = this._pre_fs_body_margin;
			window.document.body.style.overflow = this._pre_fs_body_overflow;
		}
	}
	,listen: function(_window) {
		_window.handle.addEventListener("mouseleave",$bind(this,this.on_internal_leave));
		_window.handle.addEventListener("mouseenter",$bind(this,this.on_internal_enter));
		if(_window.config.fullscreen) {
			this.internal_fullscreen(_window,_window.config.fullscreen);
			_window.config.width = _window.handle.width;
			_window.config.height = _window.handle.height;
		}
	}
	,on_internal_leave: function(_mouse_event) {
		var _window = this.system.window_from_handle(_mouse_event.target);
		this.system.app.dispatch_system_event({ type : 5, window : { type : 12, timestamp : _mouse_event.timeStamp, window_id : _window.id, event : _mouse_event}});
	}
	,on_internal_enter: function(_mouse_event) {
		var _window = this.system.window_from_handle(_mouse_event.target);
		this.system.app.dispatch_system_event({ type : 5, window : { type : 11, timestamp : _mouse_event.timeStamp, window_id : _window.id, event : _mouse_event}});
	}
	,listen_for_resize: function() {
		var _g = this;
		window.onresize = function(e) {
			if(!_g.system.app.config.web.true_fullscreen) {
				var _g1 = 0;
				var _g2 = _g.fs_windows;
				while(_g1 < _g2.length) {
					var $window = _g2[_g1];
					++_g1;
					$window.set_size(window.innerWidth,window.innerHeight);
					_g.internal_resize($window,$window.width,$window.height);
				}
			}
		};
	}
	,listen_for_visibility: function() {
		if(typeof document.hidden !== undefined) {
			this._hidden_name = "hidden";
			this._hidden_event_name = "visibilitychange";
		} else if(typeof document.mozHidden !== undefined ) {
			this._hidden_name = "mozHidden";
			this._hidden_name = "mozvisibilitychange";
		} else if(typeof document.msHidden !== "undefined") {
			this._hidden_name = "msHidden";
			this._hidden_event_name = "msvisibilitychange";
		} else if(typeof document.webkitHidden !== "undefined") {
			this._hidden_name = "webkitHidden";
			this._hidden_event_name = "webkitvisibilitychange";
		}
		if(this._hidden_name != "" && this._hidden_event_name != "") window.document.addEventListener(this._hidden_event_name,$bind(this,this.on_visibility_change));
	}
	,on_visibility_change: function(jsevent) {
		var _event = { type : 5, window : { type : 2, timestamp : snow_Snow.core.timestamp(), window_id : 1, event : jsevent}};
		if(document[this._hidden_name]) {
			_event.window.type = 3;
			this.system.app.dispatch_system_event(_event);
			_event.window.type = 8;
			this.system.app.dispatch_system_event(_event);
			_event.window.type = 14;
			this.system.app.dispatch_system_event(_event);
		} else {
			_event.window.type = 2;
			this.system.app.dispatch_system_event(_event);
			_event.window.type = 10;
			this.system.app.dispatch_system_event(_event);
			_event.window.type = 13;
			this.system.app.dispatch_system_event(_event);
		}
	}
	,internal_fallback: function(message) {
		var text_el;
		var overlay_el;
		var tmp;
		var _this = window.document;
		tmp = _this.createElement("div");
		text_el = tmp;
		var tmp1;
		var _this1 = window.document;
		tmp1 = _this1.createElement("div");
		overlay_el = tmp1;
		text_el.style.marginLeft = "auto";
		text_el.style.marginRight = "auto";
		text_el.style.color = "#d3d3d3";
		text_el.style.marginTop = "5em";
		text_el.style.fontSize = "1.4em";
		text_el.style.fontFamily = "helvetica,sans-serif";
		text_el.innerHTML = message;
		overlay_el.style.top = "0";
		overlay_el.style.left = "0";
		overlay_el.style.width = "100%";
		overlay_el.style.height = "100%";
		overlay_el.style.display = "block";
		overlay_el.style.minWidth = "100%";
		overlay_el.style.minHeight = "100%";
		overlay_el.style.textAlign = "center";
		overlay_el.style.position = "absolute";
		overlay_el.style.background = "rgba(1,1,1,0.90)";
		overlay_el.appendChild(text_el);
		window.document.body.appendChild(overlay_el);
	}
	,__class__: snow_core_web_window_Windowing
};
var snow_modules_interfaces_Audio = function() { };
$hxClasses["snow.modules.interfaces.Audio"] = snow_modules_interfaces_Audio;
snow_modules_interfaces_Audio.__name__ = true;
var snow_modules_howlerjs_Audio = function(_system) {
	this.system = _system;
	this.suspended_sounds = [];
	this.handles = new haxe_ds_ObjectMap();
};
$hxClasses["snow.modules.howlerjs.Audio"] = snow_modules_howlerjs_Audio;
snow_modules_howlerjs_Audio.__name__ = true;
snow_modules_howlerjs_Audio.__interfaces__ = [snow_modules_interfaces_Audio];
snow_modules_howlerjs_Audio.prototype = {
	init: function() {
	}
	,update: function() {
	}
	,destroy: function() {
	}
	,on_event: function(event) {
	}
	,suspend: function() {
		var $it0 = this.handles.iterator();
		while( $it0.hasNext() ) {
			var sound = $it0.next();
			if(sound.get_playing()) {
				sound.toggle();
				this.suspended_sounds.push(sound);
			}
		}
	}
	,resume: function() {
		while(this.suspended_sounds.length > 0) {
			var sound = this.suspended_sounds.pop();
			sound.toggle();
		}
	}
	,__class__: snow_modules_howlerjs_Audio
};
var snow_system_audio_Sound = function() {
	this.looping = false;
	this.pan = 0.0;
	this.volume = 1.0;
	this.pitch = 1.0;
	this.playing = false;
	this.name = "";
};
$hxClasses["snow.system.audio.Sound"] = snow_system_audio_Sound;
snow_system_audio_Sound.__name__ = true;
snow_system_audio_Sound.prototype = {
	play: function() {
	}
	,loop: function() {
	}
	,pause: function() {
	}
	,destroy: function() {
	}
	,internal_update: function() {
	}
	,internal_play: function() {
	}
	,internal_pause: function() {
	}
	,toggle: function() {
		this.set_playing(!this.get_playing());
		if(this.get_playing()) {
			if(this.get_looping()) this.loop(); else this.play();
		} else this.pause();
	}
	,get_playing: function() {
		return this.playing;
	}
	,get_info: function() {
		return this.info;
	}
	,get_pan: function() {
		return this.pan;
	}
	,get_pitch: function() {
		return this.pitch;
	}
	,get_volume: function() {
		return this.volume;
	}
	,get_looping: function() {
		return this.looping;
	}
	,set_playing: function(_playing) {
		return this.playing = _playing;
	}
	,set_looping: function(_looping) {
		return this.looping = _looping;
	}
	,__class__: snow_system_audio_Sound
};
var snow_modules_howlerjs_sound_Sound = function() { };
$hxClasses["snow.modules.howlerjs.sound.Sound"] = snow_modules_howlerjs_sound_Sound;
snow_modules_howlerjs_sound_Sound.__name__ = true;
snow_modules_howlerjs_sound_Sound.__super__ = snow_system_audio_Sound;
snow_modules_howlerjs_sound_Sound.prototype = $extend(snow_system_audio_Sound.prototype,{
	play: function() {
		if(this.get_info() != null && this.get_info().handle != null) {
			this.set_playing(true);
			this.set_looping(false);
			this.get_info().handle.loop(false);
			this.get_info().handle.play();
			if(this.get_info() != null && this.get_info().handle != null) {
				this.get_info().handle.rate(this.get_pitch());
				this.get_info().handle.volume(this.get_volume());
				this.get_info().handle.pos3d(this.get_pan());
			}
		}
	}
	,loop: function() {
		if(this.get_info() != null && this.get_info().handle != null) {
			this.set_playing(true);
			this.set_looping(true);
			this.get_info().handle.loop(true);
			this.get_info().handle.play();
			if(this.get_info() != null && this.get_info().handle != null) {
				this.get_info().handle.rate(this.get_pitch());
				this.get_info().handle.volume(this.get_volume());
				this.get_info().handle.pos3d(this.get_pan());
			}
		}
	}
	,pause: function() {
		if(this.get_info() != null && this.get_info().handle != null) this.get_info().handle.pause();
	}
	,destroy: function() {
		if(this.get_info() != null && this.get_info().handle != null) this.get_info().handle.unload();
		this.system.kill(this);
	}
	,__class__: snow_modules_howlerjs_sound_Sound
});
var snow_modules_opengl_web_GL = function() { };
$hxClasses["snow.modules.opengl.web.GL"] = snow_modules_opengl_web_GL;
snow_modules_opengl_web_GL.__name__ = true;
var snow_system_assets_Asset = function() { };
$hxClasses["snow.system.assets.Asset"] = snow_system_assets_Asset;
snow_system_assets_Asset.__name__ = true;
var snow_system_assets_AssetJSON = function() { };
$hxClasses["snow.system.assets.AssetJSON"] = snow_system_assets_AssetJSON;
snow_system_assets_AssetJSON.__name__ = true;
snow_system_assets_AssetJSON.processor = function(_app,_id,_data) {
	if(_data == null) return snow_api_Promise.reject(snow_types_Error.error("AssetJSON: data was null"));
	return new snow_api_Promise(function(resolve,reject) {
		var _data_json = null;
		try {
			_data_json = JSON.parse(new haxe_io_Bytes(new Uint8Array(_data.buffer)).toString());
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return reject(snow_types_Error.parse(e));
		}
		return resolve(_data_json);
	});
};
snow_system_assets_AssetJSON.__super__ = snow_system_assets_Asset;
snow_system_assets_AssetJSON.prototype = $extend(snow_system_assets_Asset.prototype,{
	__class__: snow_system_assets_AssetJSON
});
var snow_system_assets_Assets = function(_app) {
	this.root = "";
	this.app = _app;
	this.module = new snow_core_web_assets_Assets(this);
};
$hxClasses["snow.system.assets.Assets"] = snow_system_assets_Assets;
snow_system_assets_Assets.__name__ = true;
snow_system_assets_Assets.prototype = {
	__class__: snow_system_assets_Assets
};
var snow_system_audio_Audio = function(_app) {
	this.active = false;
	this.app = _app;
	this.module = new snow_modules_howlerjs_Audio(this);
	this.module.init();
	this.sound_list = new haxe_ds_StringMap();
	this.stream_list = new haxe_ds_StringMap();
	this.active = true;
};
$hxClasses["snow.system.audio.Audio"] = snow_system_audio_Audio;
snow_system_audio_Audio.__name__ = true;
snow_system_audio_Audio.prototype = {
	kill: function(_sound) {
		if(_sound == null) return;
		this.sound_list.remove(_sound.name);
		this.stream_list.remove(_sound.name);
	}
	,suspend: function() {
		if(!this.active) return;
		this.active = false;
		var tmp;
		var _this = this.stream_list;
		tmp = new haxe_ds__$StringMap_StringMapIterator(_this,_this.arrayKeys());
		while( tmp.hasNext() ) {
			var sound = tmp.next();
			sound.internal_pause();
		}
		this.module.suspend();
	}
	,resume: function() {
		if(this.active) return;
		this.active = true;
		this.module.resume();
		var tmp;
		var _this = this.stream_list;
		tmp = new haxe_ds__$StringMap_StringMapIterator(_this,_this.arrayKeys());
		while( tmp.hasNext() ) {
			var sound = tmp.next();
			sound.internal_play();
		}
	}
	,on_event: function(_event) {
		this.module.on_event(_event);
		if(_event.type == 10) this.suspend(); else if(_event.type == 12) this.resume();
	}
	,destroy: function() {
		this.active = false;
		var tmp;
		var _this = this.sound_list;
		tmp = new haxe_ds__$StringMap_StringMapIterator(_this,_this.arrayKeys());
		while( tmp.hasNext() ) {
			var sound = tmp.next();
			sound.destroy();
		}
		this.module.destroy();
	}
	,update: function() {
		if(!this.active) return;
		var tmp;
		var _this = this.sound_list;
		tmp = new haxe_ds__$StringMap_StringMapIterator(_this,_this.arrayKeys());
		while( tmp.hasNext() ) {
			var _sound = tmp.next();
			if(_sound.get_playing()) _sound.internal_update();
		}
		this.module.update();
	}
	,__class__: snow_system_audio_Audio
};
var snow_system_input_Input = function(_app) {
	this.touch_count = 0;
	this.app = _app;
	this.module = new snow_core_web_input_Input(this);
	this.module.init();
	this.key_code_pressed = new haxe_ds_IntMap();
	this.key_code_down = new haxe_ds_IntMap();
	this.key_code_released = new haxe_ds_IntMap();
	this.scan_code_pressed = new haxe_ds_IntMap();
	this.scan_code_down = new haxe_ds_IntMap();
	this.scan_code_released = new haxe_ds_IntMap();
	this.mouse_button_pressed = new haxe_ds_IntMap();
	this.mouse_button_down = new haxe_ds_IntMap();
	this.mouse_button_released = new haxe_ds_IntMap();
	this.gamepad_button_pressed = new haxe_ds_IntMap();
	this.gamepad_button_down = new haxe_ds_IntMap();
	this.gamepad_button_released = new haxe_ds_IntMap();
	this.gamepad_axis_values = new haxe_ds_IntMap();
	this.touches_down = new haxe_ds_IntMap();
};
$hxClasses["snow.system.input.Input"] = snow_system_input_Input;
snow_system_input_Input.__name__ = true;
snow_system_input_Input.prototype = {
	dispatch_key_down_event: function(keycode,scancode,repeat,mod,timestamp,window_id) {
		if(!repeat) {
			this.key_code_pressed.h[keycode] = false;
			this.key_code_down.h[keycode] = true;
			this.scan_code_pressed.h[scancode] = false;
			this.scan_code_down.h[scancode] = true;
		}
		this.app.host.onkeydown(keycode,scancode,repeat,mod,timestamp,window_id);
	}
	,dispatch_key_up_event: function(keycode,scancode,repeat,mod,timestamp,window_id) {
		this.key_code_released.h[keycode] = false;
		this.key_code_down.remove(keycode);
		this.scan_code_released.h[scancode] = false;
		this.scan_code_down.remove(scancode);
		this.app.host.onkeyup(keycode,scancode,repeat,mod,timestamp,window_id);
	}
	,dispatch_text_event: function(text,start,length,type,timestamp,window_id) {
		this.app.host.ontextinput(text,start,length,type,timestamp,window_id);
	}
	,dispatch_mouse_move_event: function(x,y,xrel,yrel,timestamp,window_id) {
		this.app.host.onmousemove(x,y,xrel,yrel,timestamp,window_id);
	}
	,dispatch_mouse_down_event: function(x,y,button,timestamp,window_id) {
		this.mouse_button_pressed.h[button] = false;
		this.mouse_button_down.h[button] = true;
		this.app.host.onmousedown(x,y,button,timestamp,window_id);
	}
	,dispatch_mouse_up_event: function(x,y,button,timestamp,window_id) {
		this.mouse_button_released.h[button] = false;
		this.mouse_button_down.remove(button);
		this.app.host.onmouseup(x,y,button,timestamp,window_id);
	}
	,dispatch_mouse_wheel_event: function(x,y,timestamp,window_id) {
		this.app.host.onmousewheel(x,y,timestamp,window_id);
	}
	,dispatch_touch_down_event: function(x,y,touch_id,timestamp) {
		if(!this.touches_down.h.hasOwnProperty(touch_id)) {
			this.touch_count++;
			this.touches_down.h[touch_id] = true;
		}
		this.app.host.ontouchdown(x,y,touch_id,timestamp);
	}
	,dispatch_touch_up_event: function(x,y,touch_id,timestamp) {
		this.app.host.ontouchup(x,y,touch_id,timestamp);
		if(this.touches_down.remove(touch_id)) this.touch_count--;
	}
	,dispatch_touch_move_event: function(x,y,dx,dy,touch_id,timestamp) {
		this.app.host.ontouchmove(x,y,dx,dy,touch_id,timestamp);
	}
	,dispatch_gamepad_axis_event: function(gamepad,axis,value,timestamp) {
		if(!this.gamepad_axis_values.h.hasOwnProperty(gamepad)) {
			var value1 = new haxe_ds_IntMap();
			this.gamepad_axis_values.h[gamepad] = value1;
		}
		var this1 = this.gamepad_axis_values.h[gamepad];
		this1.set(axis,value);
		this.app.host.ongamepadaxis(gamepad,axis,value,timestamp);
	}
	,dispatch_gamepad_button_down_event: function(gamepad,button,value,timestamp) {
		if(!this.gamepad_button_pressed.h.hasOwnProperty(gamepad)) {
			var value1 = new haxe_ds_IntMap();
			this.gamepad_button_pressed.h[gamepad] = value1;
		}
		if(!this.gamepad_button_down.h.hasOwnProperty(gamepad)) {
			var value2 = new haxe_ds_IntMap();
			this.gamepad_button_down.h[gamepad] = value2;
		}
		var this1 = this.gamepad_button_pressed.h[gamepad];
		this1.set(button,false);
		var this2 = this.gamepad_button_down.h[gamepad];
		this2.set(button,true);
		this.app.host.ongamepaddown(gamepad,button,value,timestamp);
	}
	,dispatch_gamepad_button_up_event: function(gamepad,button,value,timestamp) {
		if(!this.gamepad_button_released.h.hasOwnProperty(gamepad)) {
			var value1 = new haxe_ds_IntMap();
			this.gamepad_button_released.h[gamepad] = value1;
		}
		if(!this.gamepad_button_down.h.hasOwnProperty(gamepad)) {
			var value2 = new haxe_ds_IntMap();
			this.gamepad_button_down.h[gamepad] = value2;
		}
		var this1 = this.gamepad_button_released.h[gamepad];
		this1.set(button,false);
		var this2 = this.gamepad_button_down.h[gamepad];
		this2.remove(button);
		this.app.host.ongamepadup(gamepad,button,value,timestamp);
	}
	,dispatch_gamepad_device_event: function(gamepad,id,type,timestamp) {
		this.app.host.ongamepaddevice(gamepad,id,type,timestamp);
	}
	,listen: function(_window) {
		this.module.listen(_window);
	}
	,on_event: function(_event) {
		this.module.on_event(_event);
	}
	,update: function() {
		this.module.update();
		this._update_keystate();
		this._update_gamepadstate();
		this._update_mousestate();
	}
	,destroy: function() {
		this.module.destroy();
	}
	,_update_mousestate: function() {
		var $it0 = this.mouse_button_pressed.keys();
		while( $it0.hasNext() ) {
			var _code = $it0.next();
			if(this.mouse_button_pressed.h[_code]) this.mouse_button_pressed.remove(_code); else this.mouse_button_pressed.h[_code] = true;
		}
		var $it1 = this.mouse_button_released.keys();
		while( $it1.hasNext() ) {
			var _code1 = $it1.next();
			if(this.mouse_button_released.h[_code1]) this.mouse_button_released.remove(_code1); else this.mouse_button_released.h[_code1] = true;
		}
	}
	,_update_gamepadstate: function() {
		var $it0 = this.gamepad_button_pressed.iterator();
		while( $it0.hasNext() ) {
			var _gamepad_pressed = $it0.next();
			var $it1 = _gamepad_pressed.keys();
			while( $it1.hasNext() ) {
				var _button = $it1.next();
				if(_gamepad_pressed.h[_button]) _gamepad_pressed.remove(_button); else _gamepad_pressed.h[_button] = true;
			}
		}
		var $it2 = this.gamepad_button_released.iterator();
		while( $it2.hasNext() ) {
			var _gamepad_released = $it2.next();
			var $it3 = _gamepad_released.keys();
			while( $it3.hasNext() ) {
				var _button1 = $it3.next();
				if(_gamepad_released.h[_button1]) _gamepad_released.remove(_button1); else _gamepad_released.h[_button1] = true;
			}
		}
	}
	,_update_keystate: function() {
		var $it0 = this.key_code_pressed.keys();
		while( $it0.hasNext() ) {
			var _code = $it0.next();
			if(this.key_code_pressed.h[_code]) this.key_code_pressed.remove(_code); else this.key_code_pressed.h[_code] = true;
		}
		var $it1 = this.key_code_released.keys();
		while( $it1.hasNext() ) {
			var _code1 = $it1.next();
			if(this.key_code_released.h[_code1]) this.key_code_released.remove(_code1); else this.key_code_released.h[_code1] = true;
		}
		var $it2 = this.scan_code_pressed.keys();
		while( $it2.hasNext() ) {
			var _code2 = $it2.next();
			if(this.scan_code_pressed.h[_code2]) this.scan_code_pressed.remove(_code2); else this.scan_code_pressed.h[_code2] = true;
		}
		var $it3 = this.scan_code_released.keys();
		while( $it3.hasNext() ) {
			var _code3 = $it3.next();
			if(this.scan_code_released.h[_code3]) this.scan_code_released.remove(_code3); else this.scan_code_released.h[_code3] = true;
		}
	}
	,__class__: snow_system_input_Input
};
var snow_system_io_IO = function(_app) {
	this.app = _app;
	this.module = new snow_core_web_io_IO(this);
	this.module.init();
};
$hxClasses["snow.system.io.IO"] = snow_system_io_IO;
snow_system_io_IO.__name__ = true;
snow_system_io_IO.prototype = {
	data_flow: function(_id,_processor,_provider) {
		var _g = this;
		if(_provider == null) _provider = $bind(this,this.default_provider);
		return new snow_api_Promise(function(resolve,reject) {
			_provider(_g.app,_id).then(function(data) {
				if(_processor != null) _processor(_g.app,_id,data).then(resolve,reject); else resolve(data);
			}).error(reject);
		});
	}
	,default_provider: function(_app,_id) {
		return this.module.data_load(_id,null);
	}
	,__class__: snow_system_io_IO
};
var snow_system_window_Window = function(_system,_config) {
	this.internal_resize = false;
	this.internal_position = false;
	this.minimized = false;
	this.closed = true;
	this.auto_render = true;
	this.auto_swap = true;
	this.height = 0;
	this.width = 0;
	this.y = 0;
	this.x = 0;
	this.set_max_size({ x : 0, y : 0});
	this.set_min_size({ x : 0, y : 0});
	this.system = _system;
	this.asked_config = _config;
	this.config = _config;
	if(this.config.x == null) this.config.x = 536805376;
	if(this.config.y == null) this.config.y = 536805376;
	this.system.module.create(this.system.app.config.render,_config,$bind(this,this.on_window_created));
};
$hxClasses["snow.system.window.Window"] = snow_system_window_Window;
snow_system_window_Window.__name__ = true;
snow_system_window_Window.prototype = {
	on_window_created: function(_handle,_id,_configs) {
		this.id = _id;
		this.handle = _handle;
		if(this.handle == null) return;
		this.closed = false;
		this.config = _configs.config;
		this.system.app.config.render = _configs.render_config;
		this.internal_position = true;
		this.set_x(this.config.x);
		this.set_y(this.config.y);
		this.internal_position = false;
		this.internal_resize = true;
		this.set_width(this.config.width);
		this.set_height(this.config.height);
		this.internal_resize = false;
		this.on_event({ type : 1, window_id : _id, timestamp : snow_Snow.core.timestamp(), event : { }});
	}
	,on_event: function(_event) {
		var _g = _event.type;
		if(_g != null) switch(_g) {
		case 5:
			this.internal_position = true;
			this.set_position(_event.event.x,_event.event.y);
			this.internal_position = false;
			break;
		case 6:
			this.internal_resize = true;
			this.set_size(_event.event.x,_event.event.y);
			this.internal_resize = false;
			break;
		case 7:
			this.internal_resize = true;
			this.set_size(_event.event.x,_event.event.y);
			this.internal_resize = false;
			break;
		case 8:
			this.minimized = true;
			break;
		case 10:
			this.minimized = false;
			break;
		default:
		} else {
		}
		if(this.onevent != null) this.onevent(_event);
	}
	,update: function() {
		if(this.handle != null && !this.closed) this.system.module.update_window(this);
	}
	,render: function() {
		if(this.minimized || this.closed) return;
		if(this.handle == null) return;
		this.system.module.render(this);
		if(this.onrender != null) {
			this.onrender(this);
			if(this.auto_swap) this.swap();
			return;
		}
		snow_modules_opengl_web_GL.current_context.clearColor(0,0,0,1.0);
		snow_modules_opengl_web_GL.current_context.clear(16384);
		if(this.auto_swap) this.swap();
	}
	,swap: function() {
		if(this.handle == null || this.closed || this.minimized) return;
		this.system.module.swap(this);
	}
	,get_max_size: function() {
		return this.max_size;
	}
	,get_min_size: function() {
		return this.min_size;
	}
	,set_x: function(_x) {
		this.x = _x;
		if(this.handle != null && !this.internal_position) this.system.module.set_position(this,this.x,this.y);
		return this.x;
	}
	,set_y: function(_y) {
		this.y = _y;
		if(this.handle != null && !this.internal_position) this.system.module.set_position(this,this.x,this.y);
		return this.y;
	}
	,set_width: function(_width) {
		this.width = _width;
		if(this.handle != null && !this.internal_resize) this.system.module.set_size(this,this.width,this.height);
		return this.width;
	}
	,set_height: function(_height) {
		this.height = _height;
		if(this.handle != null && !this.internal_resize) this.system.module.set_size(this,this.width,this.height);
		return this.height;
	}
	,set_position: function(_x,_y) {
		var last_internal_position_flag = this.internal_position;
		this.internal_position = true;
		this.set_x(_x);
		this.set_y(_y);
		this.internal_position = last_internal_position_flag;
		if(this.handle != null && !this.internal_position) this.system.module.set_position(this,this.x,this.y);
	}
	,set_size: function(_width,_height) {
		var last_internal_resize_flag = this.internal_resize;
		this.internal_resize = true;
		this.set_width(_width);
		this.set_height(_height);
		this.internal_resize = last_internal_resize_flag;
		if(this.handle != null && !this.internal_resize) this.system.module.set_size(this,_width,_height);
	}
	,set_max_size: function(_size) {
		if(this.get_max_size() != null && this.handle != null) this.system.module.set_max_size(this,_size.x,_size.y);
		return this.max_size = _size;
	}
	,set_min_size: function(_size) {
		if(this.get_min_size() != null && this.handle != null) this.system.module.set_min_size(this,_size.x,_size.y);
		return this.min_size = _size;
	}
	,__class__: snow_system_window_Window
};
var snow_system_window_Windowing = function(_app) {
	this.window_count = 0;
	this.app = _app;
	this.window_list = new haxe_ds_IntMap();
	this.window_handles = new haxe_ds_ObjectMap();
	this.module = new snow_core_web_window_Windowing(this);
	this.module.init();
};
$hxClasses["snow.system.window.Windowing"] = snow_system_window_Windowing;
snow_system_window_Windowing.__name__ = true;
snow_system_window_Windowing.prototype = {
	create: function(_config) {
		var _window = new snow_system_window_Window(this,_config);
		this.window_list.h[_window.id] = _window;
		this.window_handles.set(_window.handle,_window.id);
		this.window_count++;
		this.module.listen(_window);
		if(_config.no_input == null || _config.no_input == false) this.app.input.listen(_window);
		return _window;
	}
	,window_from_handle: function(_handle) {
		if(this.window_handles.h.__keys__[_handle.__id__] != null) {
			var _id = this.window_handles.h[_handle.__id__];
			return this.window_list.h[_id];
		}
		return null;
	}
	,on_event: function(_event) {
		if(_event.type == 5) {
			var _window_event = _event.window;
			var _window = this.window_list.h[_window_event.window_id];
			if(_window != null) _window.on_event(_window_event);
		}
	}
	,update: function() {
		this.module.update();
		var $it0 = this.window_list.iterator();
		while( $it0.hasNext() ) {
			var $window = $it0.next();
			$window.update();
		}
		var $it1 = this.window_list.iterator();
		while( $it1.hasNext() ) {
			var window1 = $it1.next();
			if(window1.auto_render) window1.render();
		}
	}
	,destroy: function() {
		this.module.destroy();
	}
	,__class__: snow_system_window_Windowing
};
var snow_types_Error = $hxClasses["snow.types.Error"] = { __ename__ : true, __constructs__ : ["error","init","windowing","parse"] };
snow_types_Error.error = function(value) { var $x = ["error",0,value]; $x.__enum__ = snow_types_Error; $x.toString = $estr; return $x; };
snow_types_Error.init = function(value) { var $x = ["init",1,value]; $x.__enum__ = snow_types_Error; $x.toString = $estr; return $x; };
snow_types_Error.windowing = function(value) { var $x = ["windowing",2,value]; $x.__enum__ = snow_types_Error; $x.toString = $estr; return $x; };
snow_types_Error.parse = function(value) { var $x = ["parse",3,value]; $x.__enum__ = snow_types_Error; $x.toString = $estr; return $x; };
snow_types_Error.__empty_constructs__ = [];
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
$hxClasses.Math = Math;
String.prototype.__class__ = $hxClasses.String = String;
String.__name__ = true;
$hxClasses.Array = Array;
Array.__name__ = true;
Date.prototype.__class__ = $hxClasses.Date = Date;
Date.__name__ = ["Date"];
var Int = $hxClasses.Int = { __name__ : ["Int"]};
var Dynamic = $hxClasses.Dynamic = { __name__ : ["Dynamic"]};
var Float = $hxClasses.Float = Number;
Float.__name__ = ["Float"];
var Bool = $hxClasses.Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = $hxClasses.Class = { __name__ : ["Class"]};
var Enum = { };
if(Array.prototype.filter == null) Array.prototype.filter = function(f1) {
	var a1 = [];
	var _g11 = 0;
	var _g2 = this.length;
	while(_g11 < _g2) {
		var i1 = _g11++;
		var e = this[i1];
		if(f1(e)) a1.push(e);
	}
	return a1;
};
var __map_reserved = {}
var ArrayBuffer = (Function("return typeof ArrayBuffer != 'undefined' ? ArrayBuffer : null"))() || js_html_compat_ArrayBuffer;
if(ArrayBuffer.prototype.slice == null) ArrayBuffer.prototype.slice = js_html_compat_ArrayBuffer.sliceImpl;
var DataView = (Function("return typeof DataView != 'undefined' ? DataView : null"))() || js_html_compat_DataView;
var Uint8Array = (Function("return typeof Uint8Array != 'undefined' ? Uint8Array : null"))() || js_html_compat_Uint8Array._new;
gltoolbox_GeometryTools.unitQuadCache = new haxe_ds_IntMap();
gltoolbox_TextureTools.defaultParams = { channelType : 6408, dataType : 5121, filter : 9728, wrapS : 33071, wrapT : 33071, unpackAlignment : 4};
js_Boot.__toStr = {}.toString;
gltoolbox_shaders_Resample.instance = new gltoolbox_shaders_Resample();
haxe_ds_ObjectMap.count = 0;
haxe_io_FPHelper.i64tmp = (function($this) {
	var $r;
	var x = new haxe__$Int64__$_$_$Int64(0,0);
	$r = x;
	return $r;
}(this));
js_html_compat_Uint8Array.BYTES_PER_ELEMENT = 1;
shaderblox_uniforms_UTexture.lastActiveTexture = -1;
snow_api_Promises.calls = [];
snow_api_Promises.defers = [];
snow_api_Timer.running_timers = [];
snow_system_input_Scancodes.MASK = 1073741824;
snow_system_input_Scancodes.unknown = 0;
snow_system_input_Scancodes.key_a = 4;
snow_system_input_Scancodes.key_b = 5;
snow_system_input_Scancodes.key_c = 6;
snow_system_input_Scancodes.key_d = 7;
snow_system_input_Scancodes.key_e = 8;
snow_system_input_Scancodes.key_f = 9;
snow_system_input_Scancodes.key_g = 10;
snow_system_input_Scancodes.key_h = 11;
snow_system_input_Scancodes.key_i = 12;
snow_system_input_Scancodes.key_j = 13;
snow_system_input_Scancodes.key_k = 14;
snow_system_input_Scancodes.key_l = 15;
snow_system_input_Scancodes.key_m = 16;
snow_system_input_Scancodes.key_n = 17;
snow_system_input_Scancodes.key_o = 18;
snow_system_input_Scancodes.key_p = 19;
snow_system_input_Scancodes.key_q = 20;
snow_system_input_Scancodes.key_r = 21;
snow_system_input_Scancodes.key_s = 22;
snow_system_input_Scancodes.key_t = 23;
snow_system_input_Scancodes.key_u = 24;
snow_system_input_Scancodes.key_v = 25;
snow_system_input_Scancodes.key_w = 26;
snow_system_input_Scancodes.key_x = 27;
snow_system_input_Scancodes.key_y = 28;
snow_system_input_Scancodes.key_z = 29;
snow_system_input_Scancodes.key_1 = 30;
snow_system_input_Scancodes.key_2 = 31;
snow_system_input_Scancodes.key_3 = 32;
snow_system_input_Scancodes.key_4 = 33;
snow_system_input_Scancodes.key_5 = 34;
snow_system_input_Scancodes.key_6 = 35;
snow_system_input_Scancodes.key_7 = 36;
snow_system_input_Scancodes.key_8 = 37;
snow_system_input_Scancodes.key_9 = 38;
snow_system_input_Scancodes.key_0 = 39;
snow_system_input_Scancodes.enter = 40;
snow_system_input_Scancodes.escape = 41;
snow_system_input_Scancodes.backspace = 42;
snow_system_input_Scancodes.tab = 43;
snow_system_input_Scancodes.space = 44;
snow_system_input_Scancodes.equals = 46;
snow_system_input_Scancodes.leftbracket = 47;
snow_system_input_Scancodes.rightbracket = 48;
snow_system_input_Scancodes.backslash = 49;
snow_system_input_Scancodes.semicolon = 51;
snow_system_input_Scancodes.grave = 53;
snow_system_input_Scancodes.slash = 56;
snow_system_input_Scancodes.capslock = 57;
snow_system_input_Scancodes.f1 = 58;
snow_system_input_Scancodes.f2 = 59;
snow_system_input_Scancodes.f3 = 60;
snow_system_input_Scancodes.f4 = 61;
snow_system_input_Scancodes.f5 = 62;
snow_system_input_Scancodes.f6 = 63;
snow_system_input_Scancodes.f7 = 64;
snow_system_input_Scancodes.f8 = 65;
snow_system_input_Scancodes.f9 = 66;
snow_system_input_Scancodes.f10 = 67;
snow_system_input_Scancodes.f11 = 68;
snow_system_input_Scancodes.f12 = 69;
snow_system_input_Scancodes.printscreen = 70;
snow_system_input_Scancodes.insert = 73;
snow_system_input_Scancodes.home = 74;
snow_system_input_Scancodes.pageup = 75;
snow_system_input_Scancodes.end = 77;
snow_system_input_Scancodes.pagedown = 78;
snow_system_input_Scancodes.right = 79;
snow_system_input_Scancodes.left = 80;
snow_system_input_Scancodes.down = 81;
snow_system_input_Scancodes.up = 82;
snow_system_input_Scancodes.numlockclear = 83;
snow_system_input_Scancodes.kp_divide = 84;
snow_system_input_Scancodes.kp_multiply = 85;
snow_system_input_Scancodes.kp_minus = 86;
snow_system_input_Scancodes.kp_plus = 87;
snow_system_input_Scancodes.kp_1 = 89;
snow_system_input_Scancodes.kp_2 = 90;
snow_system_input_Scancodes.kp_3 = 91;
snow_system_input_Scancodes.kp_4 = 92;
snow_system_input_Scancodes.kp_5 = 93;
snow_system_input_Scancodes.kp_6 = 94;
snow_system_input_Scancodes.kp_7 = 95;
snow_system_input_Scancodes.kp_8 = 96;
snow_system_input_Scancodes.kp_9 = 97;
snow_system_input_Scancodes.kp_0 = 98;
snow_system_input_Scancodes.f13 = 104;
snow_system_input_Scancodes.f14 = 105;
snow_system_input_Scancodes.f15 = 106;
snow_system_input_Scancodes.f16 = 107;
snow_system_input_Scancodes.f17 = 108;
snow_system_input_Scancodes.f18 = 109;
snow_system_input_Scancodes.f19 = 110;
snow_system_input_Scancodes.f20 = 111;
snow_system_input_Scancodes.f21 = 112;
snow_system_input_Scancodes.f22 = 113;
snow_system_input_Scancodes.f23 = 114;
snow_system_input_Scancodes.f24 = 115;
snow_system_input_Scancodes.volumeup = 128;
snow_system_input_Scancodes.volumedown = 129;
snow_system_input_Scancodes.kp_decimal = 220;
snow_system_input_Scancodes.lctrl = 224;
snow_system_input_Scancodes.lshift = 225;
snow_system_input_Scancodes.lalt = 226;
snow_system_input_Scancodes.lmeta = 227;
snow_system_input_Scancodes.rshift = 229;
snow_system_input_Scancodes.rmeta = 231;
snow_system_input_Scancodes.audiomute = 262;
snow_system_input_Keycodes.enter = 13;
snow_system_input_Keycodes.backspace = 8;
snow_system_input_Keycodes.tab = 9;
snow_system_input_Keycodes.exclaim = 33;
snow_system_input_Keycodes.quotedbl = 34;
snow_system_input_Keycodes.hash = 35;
snow_system_input_Keycodes.percent = 37;
snow_system_input_Keycodes.dollar = 36;
snow_system_input_Keycodes.ampersand = 38;
snow_system_input_Keycodes.quote = 39;
snow_system_input_Keycodes.leftparen = 40;
snow_system_input_Keycodes.rightparen = 41;
snow_system_input_Keycodes.asterisk = 42;
snow_system_input_Keycodes.plus = 43;
snow_system_input_Keycodes.comma = 44;
snow_system_input_Keycodes.minus = 45;
snow_system_input_Keycodes.period = 46;
snow_system_input_Keycodes.slash = 47;
snow_system_input_Keycodes.leftbracket = 91;
snow_system_input_Keycodes.backslash = 92;
snow_system_input_Keycodes.rightbracket = 93;
snow_system_input_Keycodes.caret = 94;
snow_system_input_Keycodes.underscore = 95;
snow_system_input_Keycodes.backquote = 96;
snow_system_input_Keycodes.capslock = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.capslock);
snow_system_input_Keycodes.f1 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f1);
snow_system_input_Keycodes.f2 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f2);
snow_system_input_Keycodes.f3 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f3);
snow_system_input_Keycodes.f4 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f4);
snow_system_input_Keycodes.f5 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f5);
snow_system_input_Keycodes.f6 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f6);
snow_system_input_Keycodes.f7 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f7);
snow_system_input_Keycodes.f8 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f8);
snow_system_input_Keycodes.f9 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f9);
snow_system_input_Keycodes.f10 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f10);
snow_system_input_Keycodes.f11 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f11);
snow_system_input_Keycodes.f12 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f12);
snow_system_input_Keycodes.printscreen = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.printscreen);
snow_system_input_Keycodes.insert = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.insert);
snow_system_input_Keycodes.home = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.home);
snow_system_input_Keycodes.pageup = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.pageup);
snow_system_input_Keycodes["delete"] = 127;
snow_system_input_Keycodes.end = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.end);
snow_system_input_Keycodes.pagedown = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.pagedown);
snow_system_input_Keycodes.right = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.right);
snow_system_input_Keycodes.left = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.left);
snow_system_input_Keycodes.down = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.down);
snow_system_input_Keycodes.up = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.up);
snow_system_input_Keycodes.numlockclear = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.numlockclear);
snow_system_input_Keycodes.kp_divide = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_divide);
snow_system_input_Keycodes.kp_multiply = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_multiply);
snow_system_input_Keycodes.kp_minus = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_minus);
snow_system_input_Keycodes.kp_plus = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_plus);
snow_system_input_Keycodes.kp_1 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_1);
snow_system_input_Keycodes.kp_2 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_2);
snow_system_input_Keycodes.kp_3 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_3);
snow_system_input_Keycodes.kp_4 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_4);
snow_system_input_Keycodes.kp_5 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_5);
snow_system_input_Keycodes.kp_6 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_6);
snow_system_input_Keycodes.kp_7 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_7);
snow_system_input_Keycodes.kp_8 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_8);
snow_system_input_Keycodes.kp_9 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_9);
snow_system_input_Keycodes.kp_0 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_0);
snow_system_input_Keycodes.f13 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f13);
snow_system_input_Keycodes.f14 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f14);
snow_system_input_Keycodes.f15 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f15);
snow_system_input_Keycodes.f16 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f16);
snow_system_input_Keycodes.f17 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f17);
snow_system_input_Keycodes.f18 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f18);
snow_system_input_Keycodes.f19 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f19);
snow_system_input_Keycodes.f20 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f20);
snow_system_input_Keycodes.f21 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f21);
snow_system_input_Keycodes.f22 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f22);
snow_system_input_Keycodes.f23 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f23);
snow_system_input_Keycodes.f24 = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.f24);
snow_system_input_Keycodes.volumeup = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.volumeup);
snow_system_input_Keycodes.volumedown = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.volumedown);
snow_system_input_Keycodes.kp_decimal = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.kp_decimal);
snow_system_input_Keycodes.lctrl = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lctrl);
snow_system_input_Keycodes.lshift = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lshift);
snow_system_input_Keycodes.lalt = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lalt);
snow_system_input_Keycodes.lmeta = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.lmeta);
snow_system_input_Keycodes.rmeta = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.rmeta);
snow_system_input_Keycodes.audiomute = snow_system_input_Keycodes.from_scan(snow_system_input_Scancodes.audiomute);
snow_core_web_input_Input._keypress_blacklist = [snow_system_input_Keycodes.backspace,snow_system_input_Keycodes.enter];
SnowApp.main();
})(typeof console != "undefined" ? console : {log:function(){}});


}


