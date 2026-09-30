<?php
declare(strict_types=1);

function qrGfMultiply(int $a, int $b): int {
    $result=0;
    while($b>0){ if($b&1)$result^=$a; $a<<=1; if($a&0x100)$a^=0x11D; $b>>=1; }
    return $result;
}

function qrBits(int $value, int $length): string { return str_pad(decbin($value),$length,'0',STR_PAD_LEFT); }

function qrMatrix(string $content): array {
    $alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
    $text=strtoupper($content); $length=strlen($text);
    if($length>25)throw new RuntimeException('QR payload exceeds Version 1-L capacity.');
    $bits='0010'.qrBits($length,9);
    for($i=0;$i+1<$length;$i+=2){$a=strpos($alphabet,$text[$i]);$b=strpos($alphabet,$text[$i+1]);if($a===false||$b===false)throw new RuntimeException('QR payload has unsupported characters.');$bits.=qrBits($a*45+$b,11);}
    if($length%2){$a=strpos($alphabet,$text[$length-1]);if($a===false)throw new RuntimeException('QR payload has unsupported characters.');$bits.=qrBits($a,6);}
    $capacity=19*8;$bits.=str_repeat('0',min(4,$capacity-strlen($bits)));while(strlen($bits)%8)$bits.='0';
    $data=[];for($i=0;$i<strlen($bits);$i+=8)$data[]=bindec(substr($bits,$i,8));
    for($pad=0;count($data)<19;$pad++)$data[]=$pad%2?0x11:0xEC;
    $generator=[1];for($i=0;$i<7;$i++){$next=array_fill(0,count($generator)+1,0);foreach($generator as $j=>$v){$next[$j]^=$v;$next[$j+1]^=qrGfMultiply($v,1<<$i);} $generator=$next;}
    $remainder=array_fill(0,7,0);foreach($data as $byte){$factor=$byte^$remainder[0];array_shift($remainder);$remainder[]=0;for($j=0;$j<7;$j++)$remainder[$j]^=qrGfMultiply($generator[$j+1],$factor);}
    $codewords=array_merge($data,$remainder);$stream='';foreach($codewords as $word)$stream.=qrBits($word,8);
    $n=21;$matrix=array_fill(0,$n,array_fill(0,$n,null));
    $finder=function(int $ox,int $oy)use(&$matrix,$n):void{for($dy=-1;$dy<=7;$dy++)for($dx=-1;$dx<=7;$dx++){ $x=$ox+$dx;$y=$oy+$dy;if($x<0||$y<0||$x>=$n||$y>=$n)continue;$inside=$dx>=0&&$dx<=6&&$dy>=0&&$dy<=6;$dark=$inside&&($dx===0||$dx===6||$dy===0||$dy===6||($dx>=2&&$dx<=4&&$dy>=2&&$dy<=4));$matrix[$y][$x]=$dark; }};
    $finder(0,0);$finder(14,0);$finder(0,14);
    for($i=8;$i<13;$i++){$matrix[6][$i]=($i%2===0);$matrix[$i][6]=($i%2===0);}
    $dataFormat=8;$format=$dataFormat<<10;$v=$format;while($v>=1024){$shift=(int)floor(log($v,2))-10;$v^=0x537<<$shift;}$format=(($format|$v)^0x5412);
    for($i=0;$i<15;$i++){$bit=(($format>>$i)&1)!==0;
      if($i<=5)$matrix[$i][8]=$bit;elseif($i===6)$matrix[7][8]=$bit;elseif($i===7)$matrix[8][8]=$bit;elseif($i===8)$matrix[8][7]=$bit;else $matrix[8][14-$i]=$bit;
      if($i<=7)$matrix[8][$n-1-$i]=$bit;else $matrix[$n-15+$i][8]=$bit;
    }
    $matrix[13][8]=true;
    $index=0;$up=true;
    for($right=$n-1;$right>=1;$right-=2){if($right===6)$right=5;for($step=0;$step<$n;$step++){$y=$up?$n-1-$step:$step;for($offset=0;$offset<2;$offset++){$x=$right-$offset;if($matrix[$y][$x]!==null)continue;$dark=$index<strlen($stream)&&$stream[$index]==='1';$index++;if(($x+$y)%2===0)$dark=!$dark;$matrix[$y][$x]=$dark;}}$up=!$up;}
    return $matrix;
}

function qrSvg(string $content): string {
    $matrix=qrMatrix($content);$quiet=4;$size=count($matrix)+$quiet*2;$path='';
    foreach($matrix as $y=>$row)foreach($row as $x=>$dark)if($dark)$path.='M'.($x+$quiet).','.($y+$quiet).'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '.$size.' '.$size.'" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="white"/><path d="'.$path.'" fill="black"/></svg>';
}
