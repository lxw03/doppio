import java_object = require('../java_object');
import logging = require('../logging');
import ClassData = require('../ClassData');
import gLong = require('../gLong');
import util = require('../util');
import attributes = require('../attributes');
import methods = require('../methods');
import threading = require('../threading');
import ClassLoader = require('../ClassLoader');
import enums = require('../enums');
import assert = require('../assert');
import ConstantPool = require('../ConstantPool');
declare var registerNatives: (defs: any) => void;

var debug = logging.debug;

function array_get(thread: threading.JVMThread, arr: java_object.JavaArray, idx: number): any {
  if (arr == null) {
    thread.throwNewException('Ljava/lang/NullPointerException;', '');
  } else {
    var array = arr.array;
    if (idx < 0 || idx >= array.length) {
      thread.throwNewException('Ljava/lang/ArrayIndexOutOfBoundsException;', 'Tried to access an illegal index in an array.');
    } else {
      return array[idx];
    }
  }
}

function isNotNull(thread: threading.JVMThread, obj: any): boolean {
  if (obj == null) {
    thread.throwNewException('Ljava/lang/NullPointerException;', '');
    return false;
  } else {
    return true;
  }
}

function verify_array(thread: threading.JVMThread, obj: java_object.JavaArray): boolean {
  if (!(obj instanceof java_object.JavaArray)) {
    thread.throwNewException('Ljava/lang/IllegalArgumentException;', 'Object is not an array.');
    return false;
  } else {
    return true;
  }
}

class java_lang_Class {

  public static 'forName0(Ljava/lang/String;ZLjava/lang/ClassLoader;)Ljava/lang/Class;'(thread: threading.JVMThread, jvm_str: java_object.JavaObject, initialize: number, jclo: ClassLoader.JavaClassLoaderObject): void {
    var classname = util.int_classname(jvm_str.jvm2js_str());
    if (!util.verify_int_classname(classname)) {
      thread.throwNewException('Ljava/lang/ClassNotFoundException;', classname);
    } else {
      var loader = java_object.get_cl_from_jclo(thread, jclo);
      thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
      if (initialize) {
        loader.initializeClass(thread, classname, (cls: ClassData.ReferenceClassData) => {
          if (cls != null) {
            thread.asyncReturn(cls.get_class_object(thread));
          }
        });
      } else {
        loader.resolveClass(thread, classname, (cls: ClassData.ReferenceClassData) => {
          if (cls != null) {
            thread.asyncReturn(cls.get_class_object(thread));
          }
        });
      }
    }
  }

  public static 'isInstance(Ljava/lang/Object;)Z'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, obj: java_object.JavaObject): boolean {
    if (obj !== null) {
      return obj.cls.is_castable(javaThis.$cls);
    } else {
      return false;
    }
  }

  public static 'isAssignableFrom(Ljava/lang/Class;)Z'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, cls: java_object.JavaClassObject): boolean {
    return cls.$cls.is_castable(javaThis.$cls);
  }

  public static 'isInterface()Z'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): boolean {
    if (!(javaThis.$cls instanceof ClassData.ReferenceClassData)) {
      return false;
    }
    return javaThis.$cls.access_flags.isInterface();
  }

  public static 'isArray()Z'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): boolean {
    return javaThis.$cls instanceof ClassData.ArrayClassData;
  }

  public static 'isPrimitive()Z'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): boolean {
    return javaThis.$cls instanceof ClassData.PrimitiveClassData;
  }

  public static 'getName0()Ljava/lang/String;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaObject {
    return java_object.initString(thread.getBsCl(), javaThis.$cls.toExternalString());
  }

  public static 'getSuperclass()Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaClassObject {
    if (javaThis.$cls instanceof ClassData.PrimitiveClassData) {
      return null;
    }
    var cls = javaThis.$cls;
    if (cls.access_flags.isInterface() || (cls.get_super_class() == null)) {
      return null;
    }
    return cls.get_super_class().get_class_object(thread);
  }

  public static 'getInterfaces0()[Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaArray {
    var cls = javaThis.$cls;
    var ifaces = cls.get_interfaces();
    var iface_objs = ifaces.map((iface) => iface.get_class_object(thread));
    return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/Class;'), iface_objs);
  }

  public static 'getComponentType()Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaClassObject {
    if (!(javaThis.$cls instanceof ClassData.ArrayClassData)) {
      return null;
    }
    // As this array type is loaded, the component type is guaranteed
    // to be loaded as well. No need for asynchronicity.
    return (<ClassData.ArrayClassData>javaThis.$cls).get_component_class().get_class_object(thread);
  }

  public static 'getModifiers()I'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): number {
    return javaThis.$cls.access_byte;
  }

  public static 'getSigners()[Ljava/lang/Object;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaArray {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'setSigners([Ljava/lang/Object;)V'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, arg0: java_object.JavaArray): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'getEnclosingMethod0()[Ljava/lang/Object;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaArray {
    var enc_desc: java_object.JavaObject, enc_name: java_object.JavaObject,
      bsCl = thread.getBsCl();

    if (!(javaThis.$cls instanceof ClassData.ReferenceClassData)) {
      return null;
    }
    var cls: ClassData.ReferenceClassData = <ClassData.ReferenceClassData> javaThis.$cls,
      em: attributes.EnclosingMethod = <attributes.EnclosingMethod> cls.get_attribute('EnclosingMethod');
    if (em == null) {
      return null;
    }
    var enc_cls = em.encClass.getClass(cls.loader, 0).get_class_object(thread);
    if (em.encMethod != null) {
      enc_name = java_object.initString(bsCl, em.encMethod.nameAndTypeInfo.name);
      enc_desc = java_object.initString(bsCl, em.encMethod.nameAndTypeInfo.descriptor);
    } else {
      enc_name = null;
      enc_desc = null;
    }
    // array w/ 3 elements:
    // - the immediately enclosing class (java/lang/Class)
    // - the immediately enclosing method or constructor's name (can be null). (String)
    // - the immediately enclosing method or constructor's descriptor (null iff name is). (String)
    return new java_object.JavaArray(<ClassData.ArrayClassData> bsCl.getInitializedClass(thread, '[Ljava/lang/Object;'), [enc_cls, enc_name, enc_desc]);
  }

  public static 'getDeclaringClass0()Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaClassObject {
    var declaring_name, entry: attributes.IInnerClassInfo, name, _i, _len;

    if (!(javaThis.$cls instanceof ClassData.ReferenceClassData)) {
      return null;
    }
    var cls = <ClassData.ReferenceClassData> javaThis.$cls,
      icls = <attributes.InnerClasses> cls.get_attribute('InnerClasses');
    if (icls == null) {
      return null;
    }
    var my_class = cls.get_type(),
      innerClassInfo = icls.classes;
    for (_i = 0, _len = innerClassInfo.length; _i < _len; _i++) {
      entry = innerClassInfo[_i];
      if (!(entry.outerInfoIndex > 0)) {
        continue;
      }
      name = (<ConstantPool.ClassReference> cls.constant_pool.get(entry.innerInfoIndex)).name;
      if (name !== my_class) {
        continue;
      }
      // XXX(jez): this assumes that the first enclosing entry is also
      // the immediate enclosing parent, and I'm not 100% sure this is
      // guaranteed by the spec
      declaring_name = (<ConstantPool.ClassReference> cls.constant_pool.get(entry.outerInfoIndex)).name;
      return cls.loader.getResolvedClass(declaring_name).get_class_object(thread);
    }
    return null;
  }

  public static 'getProtectionDomain0()Ljava/security/ProtectionDomain;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaObject {
    return null;
  }

  public static 'getPrimitiveClass(Ljava/lang/String;)Ljava/lang/Class;'(thread: threading.JVMThread, jvm_str: java_object.JavaObject): java_object.JavaClassObject {
    var type_desc = util.typestr2descriptor(jvm_str.jvm2js_str()),
      prim_cls = thread.getBsCl().getInitializedClass(thread, type_desc);
    return prim_cls.get_class_object(thread);
  }

  public static 'getGenericSignature0()Ljava/lang/String;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaObject {
    var sigAttr = <attributes.Signature> (<ClassData.ReferenceClassData> javaThis.$cls).get_attribute('Signature');
    if (sigAttr != null && sigAttr.sig != null) {
      return java_object.initString(thread.getBsCl(), sigAttr.sig);
    } else {
      return null;
    }
  }

  public static 'getRawAnnotations()[B'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaArray {
    var cls = <ClassData.ReferenceClassData> javaThis.$cls,
      annotations = <attributes.RuntimeVisibleAnnotations> cls.get_attribute('RuntimeVisibleAnnotations');
    if (annotations != null) {
      return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[B'), annotations.rawBytes);
    }

    var methods = cls.get_methods();
    for (var sig in methods) {
      if (methods.hasOwnProperty(sig)) {
        var m = methods[sig];
        annotations = <attributes.RuntimeVisibleAnnotations> m.get_attribute('RuntimeVisibleAnnotations');
        if (annotations != null) {
          return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[B'), annotations.rawBytes);
        }
      }
    }
    return null;
  }

  public static 'getConstantPool()Lsun/reflect/ConstantPool;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): java_object.JavaObject {
    var cls = <ClassData.ReferenceClassData> javaThis.$cls;
    // @todo Make this a proper JavaObject. I don't think the JCL uses it as such,
    // but right now this function fails any automated sanity checks on return values.
    return new java_object.JavaObject(<ClassData.ReferenceClassData> thread.getBsCl().getInitializedClass(thread, 'Lsun/reflect/ConstantPool;'), {
      'Lsun/reflect/ConstantPool;constantPoolOop': cls.constant_pool
    });
  }

  public static 'getDeclaredFields0(Z)[Ljava/lang/reflect/Field;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, public_only: number): void {
    var fields = javaThis.$cls.get_fields();
    if (public_only) {
      fields = fields.filter((f) => f.access_flags.isPublic());
    }
    var base_array = [];
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    util.asyncForEach(fields,
      (f, next_item) => {
        f.reflector(thread, (jco) => {
          if (jco != null) {
            base_array.push(jco);
            next_item();
          }
        });
      }, () => {
        var field_arr_cls = <ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/reflect/Field;');
        thread.asyncReturn(new java_object.JavaArray(field_arr_cls, base_array));
      });
  }

  public static 'getDeclaredMethods0(Z)[Ljava/lang/reflect/Method;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, public_only: number): void {
    var methodsHash = javaThis.$cls.get_methods();
    var methods: methods.Method[] = (function () {
      var _results: methods.Method[] = [];
      for (var sig in methodsHash) {
        var m = methodsHash[sig];
        if (sig[0] !== '<' && (m.access_flags.isPublic() || !public_only)) {
          _results.push(m);
        }
      }
      return _results;
    })();
    var base_array = [];
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    util.asyncForEach(methods,
      (m, next_item) => {
        m.reflector(thread, false, (jco) => {
          if (jco != null) {
            base_array.push(jco);
            next_item()
          }
        });
      }, () => {
        var method_arr_cls = <ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/reflect/Method;');
        thread.asyncReturn(new java_object.JavaArray(method_arr_cls, base_array));
      });
  }

  public static 'getDeclaredConstructors0(Z)[Ljava/lang/reflect/Constructor;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject, public_only: number): void {
    var methodsHash = javaThis.$cls.get_methods();
    var methods: methods.Method[] = (function () {
      var _results: methods.Method[] = [];
      for (var sig in methodsHash) {
        var m = methodsHash[sig];
        if (m.name === '<init>') {
          _results.push(m);
        }
      }
      return _results;
    })();
    if (public_only) {
      methods = methods.filter((m) => m.access_flags.isPublic());
    }
    var ctor_array_cdata = <ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/reflect/Constructor;');
    var base_array = [];
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    util.asyncForEach(methods,
      (m, next_item) => {
        m.reflector(thread, true, (jco) => {
          if (jco != null) {
            base_array.push(jco);
            next_item()
          }
        });
      }, () => {
        thread.asyncReturn(new java_object.JavaArray(ctor_array_cdata, base_array));
      });
  }

  public static 'getDeclaredClasses0()[Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaClassObject): any {
    var ret = new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/Class;'), []),
      cls = <ClassData.ReferenceClassData> javaThis.$cls;
    if (!(cls instanceof ClassData.ReferenceClassData)) {
      return ret;
    }
    var my_class = cls.get_type();
    var iclses = <attributes.InnerClasses[]> cls.get_attributes('InnerClasses');
    if (iclses.length === 0) {
      return ret;
    }
    var flat_names = [];
    for (var i = 0; i < iclses.length; i++) {
      var names = iclses[i].classes.filter((c: attributes.IInnerClassInfo) =>
        // select inner classes where the enclosing class is my_class
        c.outerInfoIndex > 0 && (<ConstantPool.ClassReference> cls.constant_pool.get(c.outerInfoIndex)).name === my_class)
        .map((c: attributes.IInnerClassInfo) => (<ConstantPool.ClassReference> cls.constant_pool.get(c.innerInfoIndex)).name);
      flat_names.push.apply(flat_names, names);
    }
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    util.asyncForEach(flat_names,
      (name: string, next_item: () => void) => {
        cls.loader.resolveClass(thread, name, (cls) => {
          if (cls != null) {
            ret.array.push(cls.get_class_object(thread));
            next_item();
          }
        });
      }, () => thread.asyncReturn(ret));
  }

  public static 'desiredAssertionStatus0(Ljava/lang/Class;)Z'(thread: threading.JVMThread, arg0: java_object.JavaClassObject): boolean {
    // we don't need no stinkin asserts
    // @todo Support a command-line flag to enable/disable assertions, like Java.
    return false;
  }

}

class java_lang_ClassLoader$NativeLibrary {

  public static 'load(Ljava/lang/String;Z)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, name: java_object.JavaObject, isBuildIn: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'find(Ljava/lang/String;)J'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: java_object.JavaObject): gLong {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'unload(Ljava/lang/String;)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, name: java_object.JavaObject): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

}

// Fun Note: The bootstrap classloader object is represented by null.
class java_lang_ClassLoader {

  public static 'defineClass0(Ljava/lang/String;[BIILjava/security/ProtectionDomain;)Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, arg0: java_object.JavaObject, arg1: java_object.JavaArray, arg2: number, arg3: number, arg4: java_object.JavaObject): java_object.JavaClassObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'defineClass1(Ljava/lang/String;[BIILjava/security/ProtectionDomain;Ljava/lang/String;)Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, name: java_object.JavaObject, bytes: java_object.JavaArray, offset: number, len: number, pd: gLong, source: java_object.JavaObject): java_object.JavaClassObject {
    var loader = java_object.get_cl_from_jclo(thread, javaThis),
      type = util.int_classname(name.jvm2js_str()),
      cls = loader.defineClass(thread, type, util.byteArray2Buffer(bytes.array, offset, len));
    if (cls == null) {
      return null;
    }
    // Ensure that this class is resolved.
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    loader.resolveClass(thread, type, () => {
      thread.asyncReturn(cls.get_class_object(thread));
    }, true);
  }

  public static 'defineClass2(Ljava/lang/String;Ljava/nio/ByteBuffer;IILjava/security/ProtectionDomain;Ljava/lang/String;)Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, arg0: java_object.JavaObject, arg1: java_object.JavaObject, arg2: number, arg3: number, arg4: java_object.JavaObject, arg5: java_object.JavaObject): java_object.JavaClassObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'resolveClass0(Ljava/lang/Class;)V'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, cls: java_object.JavaClassObject): void {
    var loader = java_object.get_cl_from_jclo(thread, javaThis),
      type = cls.$cls.get_type();
    if (loader.getResolvedClass(type) != null) {
      return;
    }
    // Ensure that this class is resolved.
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    loader.resolveClass(thread, type, () => {
      thread.asyncReturn();
    }, true);
  }

  public static 'findBootstrapClass(Ljava/lang/String;)Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, name: java_object.JavaObject): void {
    var type = util.int_classname(name.jvm2js_str());
    // This returns null in OpenJDK7, but actually can throw an exception
    // in OpenJDK6.
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    thread.getBsCl().resolveClass(thread, type, (cls) => {
      if (cls != null) {
        thread.asyncReturn(cls.get_class_object(thread));
      }
    }, true);
  }

  public static 'findLoadedClass0(Ljava/lang/String;)Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: ClassLoader.JavaClassLoaderObject, name: java_object.JavaObject): java_object.JavaClassObject {
    var loader = java_object.get_cl_from_jclo(thread, javaThis),
      type = util.int_classname(name.jvm2js_str()),
      // Return JavaClassObject if loaded, or null otherwise.
      cls = loader.getResolvedClass(type);
    if (cls != null) {
      return cls.get_class_object(thread);
    } else {
      return null;
    }
  }

  public static 'retrieveDirectives()Ljava/lang/AssertionStatusDirectives;'(thread: threading.JVMThread): java_object.JavaObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

}

class java_lang_Compiler {

  public static 'initialize()V'(thread: threading.JVMThread): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'registerNatives()V'(thread: threading.JVMThread): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'compileClass(Ljava/lang/Class;)Z'(thread: threading.JVMThread, arg0: java_object.JavaClassObject): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'compileClasses(Ljava/lang/String;)Z'(thread: threading.JVMThread, arg0: java_object.JavaObject): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'command(Ljava/lang/Object;)Ljava/lang/Object;'(thread: threading.JVMThread, arg0: java_object.JavaObject): java_object.JavaObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  // NOP'd.
  public static 'enable()V'(thread: threading.JVMThread): void {}
  public static 'disable()V'(thread: threading.JVMThread): void {}

}

// Used for converting between numerical representations.
var conversionBuffer = new Buffer(8);

class java_lang_Double {

  public static 'doubleToRawLongBits(D)J'(thread: threading.JVMThread, num: number): gLong {
    conversionBuffer.writeDoubleLE(num, 0);
    return gLong.fromBits(conversionBuffer.readUInt32LE(0), conversionBuffer.readUInt32LE(4));
  }

  public static 'longBitsToDouble(J)D'(thread: threading.JVMThread, num: gLong): number {
    conversionBuffer.writeInt32LE(num.getLowBits(), 0);
    conversionBuffer.writeInt32LE(num.getHighBits(), 4);
    return conversionBuffer.readDoubleLE(0);
  }

}

class java_lang_Float {

  public static 'floatToRawIntBits(F)I'(thread: threading.JVMThread, num: number): number {
    conversionBuffer.writeFloatLE(num, 0);
    return conversionBuffer.readInt32LE(0);
  }

  public static 'intBitsToFloat(I)F'(thread: threading.JVMThread, num: number): number {
    conversionBuffer.writeInt32LE(num, 0);
    return conversionBuffer.readFloatLE(0);
  }

}

class java_lang_Object {

  public static 'getClass()Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): java_object.JavaClassObject {
    return javaThis.cls.get_class_object(thread);
  }

  public static 'hashCode()I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): number {
    return javaThis.ref;
  }

  public static 'clone()Ljava/lang/Object;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): java_object.JavaObject {
    return javaThis.clone();
  }

  public static 'notify()V'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    debug("TE(notify): on lock *" + javaThis.ref);
    javaThis.getMonitor().notify(thread);
  }

  public static 'notifyAll()V'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    debug("TE(notifyAll): on lock *" + javaThis.ref);
    javaThis.getMonitor().notifyAll(thread);
  }

  public static 'wait(J)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, timeout: gLong): void {
    debug("TE(wait): on lock *" + javaThis.ref);
    javaThis.getMonitor().wait(thread, (fromTimer: boolean) => {
      thread.asyncReturn();
    }, timeout.toNumber());
  }

}

class java_lang_Package {

  public static 'getSystemPackage0(Ljava/lang/String;)Ljava/lang/String;'(thread: threading.JVMThread, pkg_name_obj: java_object.JavaObject): java_object.JavaObject {
    var pkg_name = pkg_name_obj.jvm2js_str();
    if (thread.getBsCl().getPackageNames().indexOf(pkg_name) >= 0) {
      return pkg_name_obj;
    } else {
      return null;
    }
  }

  public static 'getSystemPackages0()[Ljava/lang/String;'(thread: threading.JVMThread): java_object.JavaArray {
    return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/String;'), (() => {
      var pkgNames = thread.getBsCl().getPackageNames(), i: number,
        results: java_object.JavaObject[] = [];
      for (i = 0; i < pkgNames.length; i++) {
        results.push(java_object.initString(thread.getBsCl(), pkgNames[i]));
      }
      return results;
    })());
  }

}

class java_lang_ProcessEnvironment {

  public static 'environ()[[B'(thread: threading.JVMThread): java_object.JavaArray {
    var env_arr: java_object.JavaArray[] = [], env = process.env,
      key: string, v: string;
    // convert to an array of strings of the form [key, value, key, value ...]
    for (key in env) {
      v = env[key];
      env_arr.push(new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[B'), util.bytestr2Array(key)));
      env_arr.push(new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[B'), util.bytestr2Array(v)));
    }
    return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[[B'), env_arr);
  }

}

class java_lang_reflect_Array {

  public static 'getLength(Ljava/lang/Object;)I'(thread: threading.JVMThread, arr: java_object.JavaArray): number {
    if (verify_array(thread, arr)) {
      if (isNotNull(thread, arr)) {
        return arr.array.length;
      }
    }
  }

  public static 'get(Ljava/lang/Object;I)Ljava/lang/Object;'(thread: threading.JVMThread, arr: java_object.JavaArray, idx: number): java_object.JavaObject {
    var val = array_get(thread, arr, idx);
    if (val != null) {
      // Box primitive values (fast check: prims don't have .ref attributes).
      if (val.ref == null) {
        return (<ClassData.PrimitiveClassData> arr.cls.get_component_class()).create_wrapper_object(thread, val);
      }
    }
    return val;
  }

  public static 'getBoolean(Ljava/lang/Object;I)Z': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getByte(Ljava/lang/Object;I)B': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getChar(Ljava/lang/Object;I)C': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getShort(Ljava/lang/Object;I)S': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getInt(Ljava/lang/Object;I)I': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getLong(Ljava/lang/Object;I)J': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => gLong = array_get;
  public static 'getFloat(Ljava/lang/Object;I)F': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;
  public static 'getDouble(Ljava/lang/Object;I)D': (thread: threading.JVMThread, arg0: java_object.JavaArray, arg1: number) => number = array_get;

  public static 'set(Ljava/lang/Object;ILjava/lang/Object;)V'(thread: threading.JVMThread, arr: java_object.JavaArray, idx: number, val: java_object.JavaObject): void {
    if (verify_array(thread, arr) && isNotNull(thread, arr)) {
      if (idx < 0 || idx >= arr.array.length) {
        thread.throwNewException('Ljava/lang/ArrayIndexOutOfBoundsException;', 'Tried to write to an illegal index in an array.');
      } else {
        var ccls = arr.cls.get_component_class();
        if (ccls instanceof ClassData.PrimitiveClassData) {
          if (val.cls.is_subclass(thread.getBsCl().getInitializedClass(thread, (<ClassData.PrimitiveClassData> ccls).box_class_name()))) {
            var ccname = ccls.get_type(),
              m = val.cls.method_lookup(thread, "" + util.internal2external[ccname] + "Value()" + ccname);
            thread.runMethod(m, [val], (e?, rv?) => {
              if (e) {
                thread.throwException(e);
              } else {
                arr.array[idx] = rv;
                thread.asyncReturn();
              }
            });
          } else {
            thread.throwNewException('Ljava/lang/IllegalArgumentException;', 'argument type mismatch');
          }
        } else if (val.cls.is_subclass(ccls)) {
          arr.array[idx] = val;
        } else {
          thread.throwNewException('Ljava/lang/IllegalArgumentException;', 'argument type mismatch');
        }
      }
    }
  }

  public static 'setBoolean(Ljava/lang/Object;IZ)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setByte(Ljava/lang/Object;IB)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setChar(Ljava/lang/Object;IC)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setShort(Ljava/lang/Object;IS)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setInt(Ljava/lang/Object;II)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setLong(Ljava/lang/Object;IJ)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: gLong): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setFloat(Ljava/lang/Object;IF)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'setDouble(Ljava/lang/Object;ID)V'(thread: threading.JVMThread, arg0: java_object.JavaObject, arg1: number, arg2: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'newArray(Ljava/lang/Class;I)Ljava/lang/Object;'(thread: threading.JVMThread, cls: java_object.JavaClassObject, len: number): java_object.JavaArray {
    var arrCls = <ClassData.ArrayClassData> cls.$cls.loader.getResolvedClass("[" + cls.$cls.get_type());
    return java_object.heapNewArray(thread, arrCls, len);
  }

  public static 'multiNewArray(Ljava/lang/Class;[I)Ljava/lang/Object;'(thread: threading.JVMThread, jco: java_object.JavaClassObject, lens: java_object.JavaArray): java_object.JavaArray {
    var counts = lens.array;
    var cls = jco.$cls.loader.getInitializedClass(thread, jco.$cls.get_type());
    if (cls == null) {
      thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
      jco.$cls.loader.initializeClass(thread, jco.$cls.get_type(), (cls) => {
        var type_str = (new Array(counts.length + 1)).join('[') + cls.get_type();
        thread.asyncReturn(java_object.heapMultiNewArray(thread, jco.$cls.loader, type_str, counts));
      });
    } else {
      var type_str = (new Array(counts.length + 1)).join('[') + cls.get_type();
      return java_object.heapMultiNewArray(thread, jco.$cls.loader, type_str, counts);
    }
  }

}

class java_lang_reflect_Proxy {

  public static 'defineClass0(Ljava/lang/ClassLoader;Ljava/lang/String;[BII)Ljava/lang/Class;'(thread: threading.JVMThread, cl: ClassLoader.JavaClassLoaderObject, name: java_object.JavaObject, bytes: java_object.JavaArray, offset: number, len: number): java_object.JavaClassObject {
    var loader = java_object.get_cl_from_jclo(thread, cl),
      cls = loader.defineClass(thread, util.int_classname(name.jvm2js_str()), util.byteArray2Buffer(bytes.array, offset, len));
    if (cls != null) {
      return cls.get_class_object(thread);
    }
  }

}

class java_lang_Runtime {

  public static 'availableProcessors()I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): number {
    return 1;
  }

  public static 'freeMemory()J'(thread: threading.JVMThread, javaThis: java_object.JavaObject): gLong {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'totalMemory()J'(thread: threading.JVMThread, javaThis: java_object.JavaObject): gLong {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  /**
   * Returns the maximum amount of memory that the Java Virtual Machine will
   * attempt to use, in bytes, as a Long. If there is no inherent limit then the
   * value Long.MAX_VALUE will be returned.
   *
   * Currently returns Long.MAX_VALUE because unlike other JVMs Doppio has no
   * hard limit on the heap size.
   */
  public static 'maxMemory()J'(thread: threading.JVMThread, javaThis: java_object.JavaObject): gLong {
    debug("Warning: maxMemory has no meaningful value in Doppio -- there is no hard memory limit.");
    return gLong.MAX_VALUE;
  }

  /**
   * No universal way of forcing browser to GC, so we yield in hopes
   * that the browser will use it as an opportunity to GC.
   */
  public static 'gc()V'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    setImmediate(() => {
      thread.asyncReturn();
    });
  }

  public static 'runFinalization0()V'(thread: threading.JVMThread): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'traceInstructions(Z)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'traceMethodCalls(Z)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

}

class java_lang_SecurityManager {

  public static 'getClassContext()[Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): java_object.JavaArray {
    // return an array of classes for each method on the stack
    // starting with the current method and going up the call chain
    var classes: java_object.JavaClassObject[] = [],
      stack = thread.getStackTrace(),
      i: number;
    for (i = stack.length - 1; i >= 0; i--) {
      var sf = stack[i];
      classes.push(sf.method.cls.get_class_object(thread));
    }
    return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/Class;'), classes);
  }

  public static 'currentClassLoader0()Ljava/lang/ClassLoader;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): ClassLoader.JavaClassLoaderObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'classDepth(Ljava/lang/String;)I'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: java_object.JavaObject): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'classLoaderDepth0()I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'currentLoadedClass0()Ljava/lang/Class;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): java_object.JavaClassObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

}

class java_lang_Shutdown {

  public static 'halt0(I)V'(thread: threading.JVMThread, status: number): void {
    // @todo Actually add a mechanism to abort with a code.
    thread.getThreadPool().getJVM().abort();
  }

  public static 'runAllFinalizers()V'(thread: threading.JVMThread): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

}

class java_lang_StrictMath {

  public static 'sin(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.sin(d_val);
  }

  public static 'cos(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.cos(d_val);
  }

  public static 'tan(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.tan(d_val);
  }

  public static 'asin(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.asin(d_val);
  }

  public static 'acos(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.acos(d_val);
  }

  public static 'atan(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.atan(d_val);
  }

  public static 'exp(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.exp(d_val);
  }

  public static 'log(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.log(d_val);
  }

  public static 'log10(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.log(d_val) / Math.LN10;
  }

  public static 'sqrt(D)D'(thread: threading.JVMThread, d_val: number): number {
    return Math.sqrt(d_val);
  }

  public static 'cbrt(D)D'(thread: threading.JVMThread, d_val: number): number {
    var is_neg = d_val < 0;
    if (is_neg) {
      return -Math.pow(-d_val, 1 / 3);
    } else {
      return Math.pow(d_val, 1 / 3);
    }
  }

  public static 'IEEEremainder(DD)D'(thread: threading.JVMThread, arg0: number, arg1: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'atan2(DD)D'(thread: threading.JVMThread, y: number, x: number): number {
    return Math.atan2(y, x);
  }

  public static 'pow(DD)D'(thread: threading.JVMThread, base: number, exp: number): number {
    return Math.pow(base, exp);
  }

  public static 'sinh(D)D'(thread: threading.JVMThread, d_val: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'cosh(D)D'(thread: threading.JVMThread, d_val: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'tanh(D)D'(thread: threading.JVMThread, d_val: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'hypot(DD)D'(thread: threading.JVMThread, arg0: number, arg1: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'expm1(D)D'(thread: threading.JVMThread, d_val: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'log1p(D)D'(thread: threading.JVMThread, d_val: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

}

class java_lang_String {

  public static 'intern()Ljava/lang/String;'(thread: threading.JVMThread, javaThis: java_object.JavaObject): java_object.JavaObject {
    return thread.getThreadPool().getJVM().internString(javaThis.jvm2js_str(), javaThis);
  }

}

class java_lang_System {

  public static 'setIn0(Ljava/io/InputStream;)V'(thread: threading.JVMThread, stream: java_object.JavaObject): void {
    var sys = <ClassData.ReferenceClassData> thread.getBsCl().getInitializedClass(thread, 'Ljava/lang/System;');
    sys.static_put(thread, 'in', stream);
  }

  public static 'setOut0(Ljava/io/PrintStream;)V'(thread: threading.JVMThread, stream: java_object.JavaObject): void {
    var sys = <ClassData.ReferenceClassData> thread.getBsCl().getInitializedClass(thread, 'Ljava/lang/System;');
    sys.static_put(thread, 'out', stream);
  }

  public static 'setErr0(Ljava/io/PrintStream;)V'(thread: threading.JVMThread, stream: java_object.JavaObject): void {
    var sys = <ClassData.ReferenceClassData> thread.getBsCl().getInitializedClass(thread, 'Ljava/lang/System;');
    sys.static_put(thread, 'err', stream);
  }

  public static 'currentTimeMillis()J'(thread: threading.JVMThread): gLong {
    return gLong.fromNumber((new Date).getTime());
  }

  /**
   * @todo Use performance.now() if available.
   */
  public static 'nanoTime()J'(thread: threading.JVMThread): gLong {
    return gLong.fromNumber((new Date).getTime()).multiply(gLong.fromNumber(1000000));
  }

  public static 'arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V'(thread: threading.JVMThread, src: java_object.JavaArray, src_pos: number, dest: java_object.JavaArray, dest_pos: number, length: number): void {
    var dest_comp_cls, src_comp_cls;
    // Needs to be checked *even if length is 0*.
    if ((src == null) || (dest == null)) {
      thread.throwNewException('Ljava/lang/NullPointerException;', 'Cannot copy to/from a null array.');
    }
    // Can't do this on non-array types. Need to check before I check bounds below, or else I'll get an exception.
    else if (!(src.cls instanceof ClassData.ArrayClassData) || !(dest.cls instanceof ClassData.ArrayClassData)) {
      thread.throwNewException('Ljava/lang/ArrayStoreException;', 'src and dest arguments must be of array type.');
    }
    // Also needs to be checked *even if length is 0*.
    else if (src_pos < 0 || (src_pos + length) > src.array.length || dest_pos < 0 || (dest_pos + length) > dest.array.length || length < 0) {
      // System.arraycopy requires IndexOutOfBoundsException, but Java throws an array variant of the exception in practice.
      thread.throwNewException('Ljava/lang/ArrayIndexOutOfBoundsException;', 'Tried to write to an illegal index in an array.');
    } else {
      // Special case; need to copy the section of src that is being copied into a temporary array before actually doing the copy.
      if (src === dest) {
        src = <any> {
          cls: src.cls,
          array: src.array.slice(src_pos, src_pos + length)
        };
        src_pos = 0;
      }
      if (src.cls.is_castable(dest.cls)) {
        // Fast path
        java_object.arraycopy_no_check(src, src_pos, dest, dest_pos, length);
      } else {
        // Slow path
        // Absolutely cannot do this when two different primitive types, or a primitive type and a reference type.
        src_comp_cls = src.cls.get_component_class();
        dest_comp_cls = dest.cls.get_component_class();
        if ((src_comp_cls instanceof ClassData.PrimitiveClassData) || (dest_comp_cls instanceof ClassData.PrimitiveClassData)) {
          thread.throwNewException('Ljava/lang/ArrayStoreException;', 'If calling arraycopy with a primitive array, both src and dest must be of the same primitive type.');
        } else {
          // Must be two reference types.
          java_object.arraycopy_check(thread, src, src_pos, dest, dest_pos, length);
        }
      }
    }
  }

  public static 'identityHashCode(Ljava/lang/Object;)I'(thread: threading.JVMThread, x: java_object.JavaObject): number {
    if (x != null && x.ref != null) {
      return x.ref;
    }
    return 0;
  }

  public static 'initProperties(Ljava/util/Properties;)Ljava/util/Properties;'(thread: threading.JVMThread, props: java_object.JavaObject): void {
    var setProperty = props.cls.method_lookup(thread, 'setProperty(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/Object;'),
      jvm = thread.getThreadPool().getJVM(),
      properties = jvm.getSystemPropertyNames();
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    util.asyncForEach(properties, (propertyName: string, next_item: (err?: any) => void) => {
      var propertyVal = jvm.getSystemProperty(propertyName);
      if (propertyName === 'java.class.path') {
        // Fetch from bootstrap classloader instead.
        // the first path is actually the bootclasspath (vendor/classes/)
        // XXX: Not robust to multiple bootstrap paths.
        propertyVal = thread.getBsCl().getClassPath().slice(1).join(':');
      }
      thread.runMethod(setProperty, [props, jvm.internString(propertyName), jvm.internString(propertyVal)], (e?, rv?) => {
        next_item(e);
      });
    }, (err?: any) => {
      if (err) {
        thread.throwException(err);
      } else {
        thread.asyncReturn(props);
      }
    });
  }

  public static 'mapLibraryName(Ljava/lang/String;)Ljava/lang/String;'(thread: threading.JVMThread, arg0: java_object.JavaObject): java_object.JavaObject {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

}

class java_lang_Thread {

  public static 'currentThread()Ljava/lang/Thread;'(thread: threading.JVMThread): java_object.JavaObject {
    return thread;
  }

  public static 'yield()V'(thread: threading.JVMThread): void {
    // Force the thread scheduler to pick another thread by waiting for a short
    // amount of time.
    // @todo Build this into the scheduler?
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    setImmediate(() => {
      thread.setStatus(enums.ThreadStatus.RUNNABLE);
      thread.asyncReturn();
    });
  }

  public static 'sleep(J)V'(thread: threading.JVMThread, millis: gLong): void {
    var beforeMethod = thread.currentMethod();
    thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
    setTimeout(() => {
      // Check if the thread was interrupted during our sleep. Interrupting
      // sleep causes an exception, so we need to ignore the setTimeout
      // callback in this case.
      if (beforeMethod === thread.currentMethod()) {
        thread.setStatus(enums.ThreadStatus.RUNNABLE);
        thread.asyncReturn();
      }
    }, millis.toNumber());
  }

  public static 'start0()V'(thread: threading.JVMThread, javaThis: threading.JVMThread): void {
    var runMethod = javaThis.cls.method_lookup(thread, 'run()V');
    if (runMethod != null) {
      javaThis.runMethod(runMethod, [javaThis]);
    }
  }

  public static 'isInterrupted(Z)Z'(thread: threading.JVMThread, javaThis: threading.JVMThread, clearFlag: number): boolean {
    var isInterrupted = javaThis.isInterrupted();
    if (clearFlag) {
      javaThis.setInterrupted(false);
    }
    return isInterrupted;
  }

  public static 'isAlive()Z'(thread: threading.JVMThread, javaThis: threading.JVMThread): boolean {
    var state = javaThis.getStatus();
    return state !== enums.ThreadStatus.TERMINATED && state !== enums.ThreadStatus.NEW;
  }

  public static 'countStackFrames()I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): number {
    return thread.getStackTrace().length;
  }

  public static 'holdsLock(Ljava/lang/Object;)Z'(thread: threading.JVMThread, obj: java_object.JavaObject): boolean {
    var mon = obj.getMonitor();
    return mon.getOwner() === thread;
  }

  public static 'dumpThreads([Ljava/lang/Thread;)[[Ljava/lang/StackTraceElement;'(thread: threading.JVMThread, arg0: java_object.JavaArray): java_object.JavaArray {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return null;
  }

  public static 'getThreads()[Ljava/lang/Thread;'(thread: threading.JVMThread): java_object.JavaArray {
    return new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/Thread;'), thread.getThreadPool().getThreads());
  }

  public static 'setPriority0(I)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: number): void {
    // NOP
  }

  public static 'stop0(Ljava/lang/Object;)V'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: java_object.JavaObject): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'suspend0()V'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'resume0()V'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  /**
   * Interrupts this thread.
   *
   * Unless the current thread is interrupting itself, which is always
   * permitted, the checkAccess method of this thread is invoked, which may
   * cause a SecurityException to be thrown.
   *
   * - If this thread is blocked in an invocation of the Object.wait(),
   *   wait(long), or Object.wait(long,int) methods of the Object class, or of
   *   the join(), join(long), join(long,int), sleep(long), or sleep(long,int),
   *   methods of this class, then its interrupt status will be cleared and it
   *   will receive an InterruptedException.
   *
   * - If this thread is blocked in an I/O operation upon an
   *   java.nio.channels.InterruptibleChannel then the channel will be closed,
   *   the thread's interrupt status will be set, and the thread will receive a
   *   java.nio.channels.ClosedByInterruptException.
   *
   * - If this thread is blocked in a java.nio.channels.Selector then the
   *   thread's interrupt status will be set and it will return immediately from
   *   the selection operation, possibly with a non-zero value, just as if the
   *   selector's java.nio.channels.Selector.wakeup() method were invoked.
   *
   * - If none of the previous conditions hold then this thread's interrupt
   *   status will be set.
   *
   * Interrupting a thread that is not alive need not have any effect.
   */
  public static 'interrupt0()V'(thread: threading.JVMThread, javaThis: threading.JVMThread): void {
    function throwInterruptedException() {
      javaThis.throwNewException('Ljava/lang/InterruptedException;', 'interrupt0 called');
    }

    // See if we have access to modify this thread.
    var checkAccessMethod = javaThis.cls.method_lookup(thread, 'checkAccess()V');
    if (checkAccessMethod != null) {
      thread.runMethod(checkAccessMethod, [javaThis], (e?, rv?) => {
        if (e) {
          // SecurityException. Rethrow it.
          thread.throwException(e);
        } else {
          // Check if thread is alive.
          var status = javaThis.getStatus();
          switch (status) {
            case enums.ThreadStatus.NEW:
            case enums.ThreadStatus.TERMINATED:
              // Thread is not alive. NOP.
              return thread.asyncReturn();
            case enums.ThreadStatus.BLOCKED:
            case enums.ThreadStatus.WAITING:
            case enums.ThreadStatus.TIMED_WAITING:
              // Thread is waiting or blocked on a monitor. Clear interrupted
              // status, and throw an interrupted exception.
              javaThis.setInterrupted(false);
              // Exit the monitor.
              var monitor = javaThis.getMonitorBlock();
              if (status === enums.ThreadStatus.BLOCKED) {
                monitor.unblock(javaThis, true);
                throwInterruptedException();
              } else {
                monitor.unwait(javaThis, false, true, throwInterruptedException);
              }
              return thread.asyncReturn();
            case enums.ThreadStatus.PARKED:
              // Parked threads become unparked when interrupted.
              javaThis.getThreadPool().completelyUnpark(javaThis);
              // FALL-THROUGH
            default:
              var threadCls = thread.getBsCl().getInitializedClass(thread, 'Ljava/lang/Thread;'),
                // If we are in the following methods, we throw an InterruptedException:
                interruptMethods: methods.Method[] = [
                  threadCls.method_lookup(thread, 'join()V'),   // * Thread.join()
                  threadCls.method_lookup(thread, 'join(J)V'),  // * Thread.join(long)
                  threadCls.method_lookup(thread, 'join(JI)V'), // * Thread.join(long, int)
                  threadCls.method_lookup(thread, 'sleep(J)V'), // * Thread.sleep(long)
                  threadCls.method_lookup(thread, 'sleep(JI)V') // * Thread.sleep(long, int)
                ],
                stackTrace = javaThis.getStackTrace(),
                currentMethod = stackTrace[stackTrace.length - 1].method;
              if (interruptMethods.indexOf(currentMethod) !== -1) {
                // Clear interrupt state before throwing the exception.
                javaThis.setInterrupted(false);
                javaThis.throwNewException('Ljava/lang/InterruptedException;', 'interrupt0 called');
              } else {
                // Set the interrupted status.
                javaThis.setInterrupted(true);
              }
              return thread.asyncReturn();
          }
        }
      });
    }
  }

}

/**
 * @todo Don't create a stack trace every time an element is created. Use the
 * field in the object.
 */
class java_lang_Throwable {

  /**
   * NOTE: Integer is only there to distinguish this function from non-native fillInStackTrace()V.
   */
  public static 'fillInStackTrace(I)Ljava/lang/Throwable;'(thread: threading.JVMThread, javaThis: java_object.JavaObject, dummy: number): java_object.JavaObject {
    var stacktrace = [],
      cstack = thread.getStackTrace(),
      i: number, j: number, bsCl = thread.getBsCl(),
      stackTraceElementCls = <ClassData.ReferenceClassData> bsCl.getInitializedClass(thread, 'Ljava/lang/StackTraceElement;'),
      strace: java_object.JavaArray;
    /**
     * OK, so we need to toss the following stack frames:
     * - The stack frame for this method.
     * - If we're still constructing the throwable object, we need to toss any
     *   stack frames involved in constructing the throwable. But if we're not,
     *   then there's no other frames we should cut.
     */
    cstack.pop(); // The stack frame for this method.
    // Bytecode methods involved in constructing the throwable. We assume that
    // there are no native methods involved in the mix other than this one.
    while (cstack.length > 0 &&
      !cstack[cstack.length - 1].method.access_flags.isNative() &&
      cstack[cstack.length - 1].locals[0] === javaThis) {
      cstack.pop();
    }

    for (i = 0; i < cstack.length; i++) {
      var sf = cstack[i],
        cls = sf.method.cls,
        ln = -1,
        sourceFile: string;
      if (sf.method.access_flags.isNative()) {
        sourceFile = 'Native Method';
      } else {
        var srcAttr = <attributes.SourceFile> cls.get_attribute('SourceFile'),
          code = sf.method.getCodeAttribute(),
          table = <attributes.LineNumberTable> code.getAttribute('LineNumberTable');
        sourceFile = (srcAttr != null) ? srcAttr.filename : 'unknown';

        if (table != null) {
          ln = table.getLineNumber(sf.pc);
        } else {
          ln = -1;
        }
      }
      stacktrace.push(new java_object.JavaObject(stackTraceElementCls, {
        'Ljava/lang/StackTraceElement;declaringClass': java_object.initString(bsCl, util.ext_classname(cls.get_type())),
        'Ljava/lang/StackTraceElement;methodName': java_object.initString(bsCl, sf.method.name != null ? sf.method.name : 'unknown'),
        'Ljava/lang/StackTraceElement;fileName': java_object.initString(bsCl, sourceFile),
        'Ljava/lang/StackTraceElement;lineNumber': ln
      }));
    }
    strace = new java_object.JavaArray(<ClassData.ArrayClassData> thread.getBsCl().getInitializedClass(thread, '[Ljava/lang/StackTraceElement;'), stacktrace.reverse());
    javaThis.set_field(thread, 'Ljava/lang/Throwable;backtrace', strace);
    return javaThis;
  }

  public static 'getStackTraceDepth()I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): number {
    return javaThis.get_field(thread, 'Ljava/lang/Throwable;backtrace').array.length;
  }

  public static 'getStackTraceElement(I)Ljava/lang/StackTraceElement;'(thread: threading.JVMThread, javaThis: java_object.JavaObject, depth: number): java_object.JavaObject {
    return javaThis.get_field(thread, 'Ljava/lang/Throwable;backtrace').array[depth];
  }

}

class java_lang_UNIXProcess {

  public static 'waitForProcessExit(I)I'(thread: threading.JVMThread, javaThis: java_object.JavaObject, arg0: number): number {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
    // Satisfy TypeScript return type.
    return 0;
  }

  public static 'forkAndExec(I[B[B[BI[BI[B[IZ)I'(thread: threading.JVMThread, javaThis: java_object.JavaObject): void {
    thread.throwNewException('Ljava/lang/Error;', "Doppio doesn't support forking processes.");
  }

  public static 'destroyProcess(IZ)V'(thread: threading.JVMThread, arg0: number): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

  public static 'init()V'(thread: threading.JVMThread): void {
    thread.throwNewException('Ljava/lang/UnsatisfiedLinkError;', 'Native method not implemented.');
  }

}

/**
 * Misc. MemberName-specific constants, enum'd so they get inlined.
 */
enum MemberNameConstants {
  /* Bit masks for FLAGS for particular types */
  IS_METHOD           = 0x00010000, // method (not constructor)
  IS_CONSTRUCTOR      = 0x00020000, // constructor
  IS_FIELD            = 0x00040000, // field
  IS_TYPE             = 0x00080000, // nested type
  CALLER_SENSITIVE    = 0x00100000, // @CallerSensitive annotation detected
  /* Passed in in matchFlags argument of MHN.getMembers */
  SEARCH_SUPERCLASSES = 0x00100000,
  SEARCH_INTERFACES   = 0x00200000,
  /* Number of bits to shift over the reference kind into the MN's flags. */
  REFERENCE_KIND_SHIFT = 24,
  /* Mask to extract member type. */
  ALL_KINDS = (IS_METHOD | IS_CONSTRUCTOR | IS_FIELD | IS_TYPE)
}

class java_lang_invoke_MethodHandleNatives {
  /**
   * I'm going by JAMVM's implementation of this method, which is very easy
   * to understand:
   * http://sourceforge.net/p/jamvm/code/ci/master/tree/src/classlib/openjdk/mh.c#l388
   *
   * The second argument is a Reflection object for the specified member,
   * which is either a Field, Method, or Constructor.
   *
   * We need to:
   * * Set "clazz" field to item's declaring class in the reflection object.
   * * Set "flags" field to items's flags, OR'd with its type (method/field/
   *   constructor), and OR'd with its reference kind shifted up by 24.
   * * Set "vmtarget" to a pointer to the member.
   *
   * NOTE: As a non-native VM, we ignore "vmtarget". Also, "vmtarget" is an
   * "injected field" that is not exposed to JVM code, and we don't support
   * those yet.
   */
  public static 'init(Ljava/lang/invoke/MemberName;Ljava/lang/Object;)V'(thread: threading.JVMThread, self: java_object.JavaObject, ref: java_object.JavaObject): void {
    var clazz: java_object.JavaClassObject = ref.get_field(thread, ref.cls.this_class + "clazz"),
      flags: number = ref.get_field(thread, ref.cls.this_class + "modifiers"),
      flagsParsed: util.Flags = new util.Flags(flags),
      refKind: number, method: methods.Method;
    self.set_field(thread, 'Ljava/lang/invoke/MemberName;clazz', clazz);

    switch (ref.cls.this_class) {
      case "Ljava/lang/reflect/Method;":
        flags |= MemberNameConstants.IS_METHOD;
        if (flagsParsed.isStatic()) {
          refKind = enums.MethodHandleReferenceKind.INVOKESTATIC;
        } else if (clazz.$cls.access_flags.isInterface()) {
          refKind = enums.MethodHandleReferenceKind.INVOKEINTERFACE;
        } else {
          refKind = enums.MethodHandleReferenceKind.INVOKEVIRTUAL;
        }
        // TODO: Is the @CallerSensitive annotation present on the method? Requires a slot->method lookup function.
        break;
      case "Ljava/lang/reflect/Constructor;":
        flags |= MemberNameConstants.IS_CONSTRUCTOR;
        refKind = enums.MethodHandleReferenceKind.INVOKESPECIAL;
        // TODO: Is the @CallerSensitive annotation present on the method? Requires a slot->method lookup function.
        break;
      case "Ljava/lang/reflect/Field;":
        flags |= MemberNameConstants.IS_FIELD;
        refKind = flagsParsed.isStatic() ? enums.MethodHandleReferenceKind.GETSTATIC : enums.MethodHandleReferenceKind.GETFIELD;
        break;
      default:
        thread.throwNewException("Ljava/lang/InternalError;", "init: Invalid target.");
        break;
    }
    flags |= refKind << MemberNameConstants.REFERENCE_KIND_SHIFT;
    self.set_field(thread, 'Ljava/lang/invoke/MemberName;flags', flags);
  }

  public static 'getConstant(I)I'(thread: threading.JVMThread, arg0: number): number {
    // I have no idea what the semantics are, but returning 0 disables some internal MH-related counting.
    return 0;
  }

  /**
   * I'm going by JAMVM's implementation of resolve:
   * http://sourceforge.net/p/jamvm/code/ci/master/tree/src/classlib/openjdk/mh.c#l1266
   *
   * Resolve appears to perform dynamic lookup, and updates flags and
   * "vmtarget" appropriately.
   */
  public static 'resolve(Ljava/lang/invoke/MemberName;Ljava/lang/Class;)Ljava/lang/invoke/MemberName;'(thread: threading.JVMThread, memberName: java_object.JavaObject, mh_class: java_object.JavaClassObject): java_object.JavaObject {
    var type: java_object.JavaObject = memberName.get_field(thread, 'Ljava/lang/invoke/MemberName;type'),
      name: string = (<java_object.JavaObject> memberName.get_field(thread, 'Ljava/lang/invoke/MemberName;name')).jvm2js_str(),
      clazz = (<java_object.JavaClassObject> memberName.get_field(thread, 'Ljava/lang/invoke/MemberName;clazz')).$cls,
      flags: number = memberName.get_field(thread, 'Ljava/lang/invoke/MemberName;flags');

    if (clazz === null || name == null || type == null) {
      thread.throwNewException("Ljava/lang/IllegalArgumentException;", "Invalid MemberName.");
      return;
    }

    switch (flags & MemberNameConstants.ALL_KINDS) {
      case MemberNameConstants.IS_CONSTRUCTOR:
      case MemberNameConstants.IS_METHOD:
        // Need to perform method lookup.
        // XXX: Should have a better way than this! >_<
        thread.setStatus(enums.ThreadStatus.ASYNC_WAITING);
        thread.runMethod(type.cls.method_lookup(thread, 'toMethodDescriptorString()Ljava/lang/String;'), [type], (e?: java_object.JavaObject, str?: java_object.JavaObject) => {
          if (e) {
            thread.throwException(e);
          } else {
            processMethod(str.jvm2js_str());
            thread.asyncReturn(memberName);
          }
        });
        break;
      case MemberNameConstants.IS_FIELD:
        flags |= clazz.field_lookup(thread, name).access_byte;
        finish();
        return memberName;
        break;
      default:
        thread.throwNewException('Ljava/lang/LinkageError;', 'resolve member name');
        break;
    }

    function processMethod(desc: string) {
      var method: methods.Method = clazz.method_lookup(thread, name + desc);
      flags |= method.access_byte;
      finish();
    }

    function finish() {
      memberName.set_field(thread, 'Ljava/lang/invoke/MemberName;flags', flags);
    }
  }
}

registerNatives({
  'java/lang/Class': java_lang_Class,
  'java/lang/ClassLoader$NativeLibrary': java_lang_ClassLoader$NativeLibrary,
  'java/lang/ClassLoader': java_lang_ClassLoader,
  'java/lang/Compiler': java_lang_Compiler,
  'java/lang/Double': java_lang_Double,
  'java/lang/Float': java_lang_Float,
  'java/lang/Object': java_lang_Object,
  'java/lang/Package': java_lang_Package,
  'java/lang/ProcessEnvironment': java_lang_ProcessEnvironment,
  'java/lang/reflect/Array': java_lang_reflect_Array,
  'java/lang/reflect/Proxy': java_lang_reflect_Proxy,
  'java/lang/Runtime': java_lang_Runtime,
  'java/lang/SecurityManager': java_lang_SecurityManager,
  'java/lang/Shutdown': java_lang_Shutdown,
  'java/lang/StrictMath': java_lang_StrictMath,
  'java/lang/String': java_lang_String,
  'java/lang/System': java_lang_System,
  'java/lang/Thread': java_lang_Thread,
  'java/lang/Throwable': java_lang_Throwable,
  'java/lang/UNIXProcess': java_lang_UNIXProcess,
  'java/lang/invoke/MethodHandleNatives': java_lang_invoke_MethodHandleNatives
});
