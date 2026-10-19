/**
 * 示例数据（取自 test 目录现有样本），与 HTML 版 hextools 保持一致。
 */
export const SAMPLES = [
  {
    label: '角色条目（hex.js）',
    hex: '2a219911362111f1995d00155de08a00010006006d0069006c006f0064006f00ed00ed0017006363634e6373736477777763646477646464646464646400000401000202000103005c0044000d06110c140b1201210301010202010201003c00000000002b64642b0a0a0cecf105b02850a6e70fd8ced8f1ce00e2f1c9e2e7fbe2f614c9ce23ce0f280000c4d0d0d8c4d8e8d0e4b4e8bcd4c4e4ece4d0a6e8ee0041371e140004006d0069006c006f0064006f000000050000000600000000000700c0cf080041d00900abfd0a00200b00020305000c00130f00000d0000000e00a41300000f00a77009001000000000001100e9e20d001200000000001300000000001400000000001500000000001365c76a000000000100000000',
    schema:
      '// 角色条目 schema（来自 hexc.js）\n' +
      'const getFieldLength = (data) => data.nameLen * 2\n' +
      'const schema = [\n' +
      "    { name: 'slotId', type: Type.HEX, length: 16 }, // 插槽id\n" +
      "    { name: 'worldId', type: Type.UINT16 }, // 世界id\n" +
      "    { name: 'nameLen', type: Type.UINT16 }, // 角色名称长度（utf16le 字符数）\n" +
      "    { name: 'name', type: Type.UTF16LE, length: getFieldLength }, // 变长：nameLen*2 字节\n" +
      "    { name: 'afterName4', type: Type.HEX, length: 4 },\n" +
      "    { name: 'appearanceLen', type: Type.UINT16 }, // 外观串长\n" +
      "    { name: 'appearance', type: Type.HEX, length: (d) => d.appearanceLen },\n" +
      "    { name: 'unkown1', type: Type.UINT16 },\n" +
      "    { name: '种族', type: Type.UINT8 },\n" +
      "    { name: 'const1b', type: Type.UINT8 },\n" +
      "    { name: '性别', type: Type.UINT16, endian: false }, // u16BE\n" +
      "    { name: 'const2', type: Type.UINT8 },\n" +
      "    { name: 'const0b', type: Type.UINT8 },\n" +
      "    { name: '职业', type: Type.UINT8 },\n" +
      "    { name: 'const3', type: Type.UINT8 },\n" +
      "    { name: 'const0c', type: Type.UINT8 },\n" +
      "    { name: 'const92', type: Type.UINT16 },\n" +
      "    { name: 'fieldE', type: Type.UINT16 },\n" +
      "    { name: 'run18', type: Type.HEX, length: 18 },\n" +
      "    { name: 'fieldF', type: Type.UINT32 },\n" +
      "    { name: 'const0d', type: Type.UINT16 },\n" +
      "    { name: 'blob62', type: Type.HEX, length: 62 },\n" +
      "    { name: 'fieldX', type: Type.UINT32 },\n" +
      "    { name: 'const4', type: Type.UINT8 },\n" +
      "    { name: 'const0e', type: Type.UINT8 },\n" +
      "    { name: 'name2', type: Type.UTF16LE, length: getFieldLength }, // 第二处名字\n" +
      "    { name: 'nameTerm', type: Type.UINT16 },\n" +
      "    { name: 'stats', type: Type.HEX, length: 89 },\n" +
      "    { name: 'lastPlayUnix', type: Type.UINT32 },\n" +
      "    { name: 'const0f', type: Type.UINT32 },\n" +
      "    { name: 'tail', type: Type.HEX, length: 5 },\n" +
      ']',
  },
  {
    label: '角色数据帧（hext.js）',
    hex: '85000000b300000000001000000001000635000000000100000100030203280c0a06050c14031002180304010202010106003f0000000000002121000e0505000000000028cee2000019f60000003200001e32000000ba000000000000000000000000000000000000000000000000000000ec0000000000000005006d006f006d006f006300000000',
    schema:
      '// hext.js 完整重映射 schema（137B 全消费）\n' +
      'const schema = [\n' +
      "    { name: 'payloadLen', type: Type.UINT32 },                              // @0  u32 LE = 133\n" +
      "    { name: 'blockType', type: Type.UINT16 },                              // @4  u16 = 0x00b3\n" +
      "    { name: 'c1', type: Type.UINT32 },                              // @6  u32 = 0\n" +
      "    { name: 'c2', type: Type.UINT16 },                              // @10 u16 = 0x0010\n" +
      "    { name: 'c3', type: Type.UINT16 },                              // @12 u16 = 0\n" +
      "    { name: 'flag', type: Type.UINT16 },                              // @14 u16 = 1\n" +
      "    { name: 'counter', type: Type.UINT16 },                              // @16 u16 = 0x3506\n" +
      "    { name: 'c4', type: Type.UINT32 },                              // @18 u32 = 0\n" +
      "    { name: 'c5', type: Type.UINT32 },                              // @22 u32 = 0x01000001\n" +
      "    { name: 'c6', type: Type.UINT8 },                               // @26 u8  = 0\n" +
      "    { name: 'appearance', type: Type.HEX, length: 23 },                     // @27 23B\n" +
      "    { name: 'sub1_0x003f', type: Type.UINT16 },                             // @50 u16 = 0x003f\n" +
      "    { name: 'gap1', type: Type.HEX, length: 5 },                     // @52 5B 零\n" +
      "    { name: 'sub2_0x2121', type: Type.UINT16 },                             // @57 u16 = 0x2121\n" +
      "    { name: 'gap2', type: Type.HEX, length: 1 },                     // @59 1B\n" +
      "    { name: 'sub3_0x050e', type: Type.UINT16 },                             // @60 u16 = 0x050e\n" +
      "    { name: 'pad1', type: Type.HEX, length: 2 },                     // @62 2B\n" +
      "    { name: 'gap3', type: Type.HEX, length: 4 },                     // @64 4B 零\n" +
      "    { name: 'sub4_0xce28', type: Type.UINT16 },                             // @68 u16 = 0xce28\n" +
      "    { name: 'pad2', type: Type.HEX, length: 2 },                     // @70 2B\n" +
      "    { name: 'gap4', type: Type.HEX, length: 1 },                     // @72 1B\n" +
      "    { name: 'sub5_0xf619', type: Type.UINT16 },                             // @73 u16 = 0xf619\n" +
      "    { name: 'gap5', type: Type.HEX, length: 1 },                     // @75 1B\n" +
      "    { name: 'gap6', type: Type.HEX, length: 1 },                     // @76 1B\n" +
      "    { name: 'sub6_0x0032', type: Type.UINT16 },                             // @77 u16 = 0x0032\n" +
      "    { name: 'gap7', type: Type.HEX, length: 1 },                     // @79 1B\n" +
      "    { name: 'gap8', type: Type.HEX, length: 1 },                     // @80 1B\n" +
      "    { name: 'sub7_0x321e', type: Type.UINT16 },                             // @81 u16 = 0x321e\n" +
      "    { name: 'gap9', type: Type.HEX, length: 1 },                     // @83 1B\n" +
      "    { name: 'gap10', type: Type.HEX, length: 1 },                    // @84 1B\n" +
      "    { name: 'sub8_0x00ba', type: Type.UINT16 },                             // @85 u16 = 0x00ba\n" +
      "    { name: 'gap11', type: Type.HEX, length: 1 },                    // @87 1B\n" +
      "    { name: 'gap12', type: Type.HEX, length: 25 },                    // @88 25B 零\n" +
      "    { name: 'sub9_0x00ec', type: Type.UINT16 },                             // @113 u16 = 0x00ec\n" +
      "    { name: 'gap15', type: Type.HEX, length: 7 },                    // @115 7B 零\n" +
      "    { name: 'nameLen', type: Type.UINT16 },                                // @122 u16 = 5\n" +
      "    { name: 'name', type: Type.UTF16LE, length: (d) => d.nameLen * 2 },   // @124 'momoc'\n" +
      "    { name: 'trailing', type: Type.HEX, length: 3 },                       // @134 3B 零\n" +
      ']',
  },
]
