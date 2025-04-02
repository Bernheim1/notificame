import { TipoSalidaEnum } from "../enums/tipo-salida-enum";

export class Salida {
    tipoSalida : TipoSalidaEnum = TipoSalidaEnum.SinAsignar;
    localidad : string = ''; 
    domicilio : string = '';
    nro : number = 0;
    piso : number = 0;
    depto : string = '';
    unidad : string = '';
}
