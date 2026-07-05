package excel

import "context"

// 导出

// 导出文件类型：xlsx、csv

// 导出数据数据类型支持：结构体、map[string]any、数组（后两种需要带表头）

// 支持大数据导出使用sheet进行划分

// 支持自定义数据转化

// zip压缩

// 通过并发实现高效导出

type DataExample struct {
	ID   int64  `excel:"header=ID,index=0"`
	Name string `excel:"header=姓名,index=1"`
	Age  int    `excel:"header=年龄,index=2"`
}

type Export struct {
	
}

// 创建任务

// 数据导出

// 完成写入数据

func ExcelExport(ctx context.Context, data any, sheetName string, fileName string) {
}
