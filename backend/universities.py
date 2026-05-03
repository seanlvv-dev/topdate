"""
中国39所985高校数据
格式: { id, name(中文), short_name(英文缩写), province(省份), city(城市), email_domains(邮箱域名列表) }
"""
from __future__ import annotations
from typing import Optional
UNIVERSITIES = [
    {"id": 1, "name": "北京大学", "short_name": "PKU", "province": "北京", "city": "北京",
     "email_domains": ["pku.edu.cn", "stu.pku.edu.cn"], "region": "华北"},
    {"id": 2, "name": "清华大学", "short_name": "THU", "province": "北京", "city": "北京",
     "email_domains": ["mails.tsinghua.edu.cn", "tsinghua.edu.cn"], "region": "华北"},
    {"id": 3, "name": "复旦大学", "short_name": "FDU", "province": "上海", "city": "上海",
     "email_domains": ["m.fudan.edu.cn", "fudan.edu.cn"], "region": "华东"},
    {"id": 4, "name": "上海交通大学", "short_name": "SJTU", "province": "上海", "city": "上海",
     "email_domains": ["sjtu.edu.cn", "alumni.sjtu.edu.cn"], "region": "华东"},
    {"id": 5, "name": "浙江大学", "short_name": "ZJU", "province": "浙江", "city": "杭州",
     "email_domains": ["zju.edu.cn"], "region": "华东"},
    {"id": 6, "name": "南京大学", "short_name": "NJU", "province": "江苏", "city": "南京",
     "email_domains": ["smail.nju.edu.cn", "nju.edu.cn"], "region": "华东"},
    {"id": 7, "name": "中国科学技术大学", "short_name": "USTC", "province": "安徽", "city": "合肥",
     "email_domains": ["mail.ustc.edu.cn", "ustc.edu.cn"], "region": "华东"},
    {"id": 8, "name": "哈尔滨工业大学", "short_name": "HIT", "province": "黑龙江", "city": "哈尔滨",
     "email_domains": ["stu.hit.edu.cn", "hit.edu.cn", "hitwh.edu.cn", "hitsz.edu.cn"], "region": "东北"},
    {"id": 9, "name": "西安交通大学", "short_name": "XJTU", "province": "陕西", "city": "西安",
     "email_domains": ["stu.xjtu.edu.cn", "xjtu.edu.cn"], "region": "西北"},
    {"id": 10, "name": "中国人民大学", "short_name": "RUC", "province": "北京", "city": "北京",
     "email_domains": ["ruc.edu.cn"], "region": "华北"},
    {"id": 11, "name": "北京师范大学", "short_name": "BNU", "province": "北京", "city": "北京",
     "email_domains": ["mail.bnu.edu.cn", "bnu.edu.cn"], "region": "华北"},
    {"id": 12, "name": "北京航空航天大学", "short_name": "BUAA", "province": "北京", "city": "北京",
     "email_domains": ["buaa.edu.cn"], "region": "华北"},
    {"id": 13, "name": "北京理工大学", "short_name": "BIT", "province": "北京", "city": "北京",
     "email_domains": ["bit.edu.cn"], "region": "华北"},
    {"id": 14, "name": "中国农业大学", "short_name": "CAU", "province": "北京", "city": "北京",
     "email_domains": ["cau.edu.cn"], "region": "华北"},
    {"id": 15, "name": "中央民族大学", "short_name": "MUC", "province": "北京", "city": "北京",
     "email_domains": ["muc.edu.cn"], "region": "华北"},
    {"id": 16, "name": "南开大学", "short_name": "NKU", "province": "天津", "city": "天津",
     "email_domains": ["mail.nankai.edu.cn", "nankai.edu.cn"], "region": "华北"},
    {"id": 17, "name": "天津大学", "short_name": "TJU", "province": "天津", "city": "天津",
     "email_domains": ["tju.edu.cn"], "region": "华北"},
    {"id": 18, "name": "大连理工大学", "short_name": "DLUT", "province": "辽宁", "city": "大连",
     "email_domains": ["mail.dlut.edu.cn", "dlut.edu.cn"], "region": "东北"},
    {"id": 19, "name": "东北大学", "short_name": "NEU", "province": "辽宁", "city": "沈阳",
     "email_domains": ["mail.neu.edu.cn", "neu.edu.cn"], "region": "东北"},
    {"id": 20, "name": "吉林大学", "short_name": "JLU", "province": "吉林", "city": "长春",
     "email_domains": ["mails.jlu.edu.cn", "jlu.edu.cn"], "region": "东北"},
    {"id": 21, "name": "同济大学", "short_name": "Tongji", "province": "上海", "city": "上海",
     "email_domains": ["tongji.edu.cn", "mail.tongji.edu.cn"], "region": "华东"},
    {"id": 22, "name": "华东师范大学", "short_name": "ECNU", "province": "上海", "city": "上海",
     "email_domains": ["stu.ecnu.edu.cn", "ecnu.edu.cn"], "region": "华东"},
    {"id": 23, "name": "东南大学", "short_name": "SEU", "province": "江苏", "city": "南京",
     "email_domains": ["seu.edu.cn"], "region": "华东"},
    {"id": 24, "name": "厦门大学", "short_name": "XMU", "province": "福建", "city": "厦门",
     "email_domains": ["stu.xmu.edu.cn", "xmu.edu.cn"], "region": "华东"},
    {"id": 25, "name": "山东大学", "short_name": "SDU", "province": "山东", "city": "济南",
     "email_domains": ["mail.sdu.edu.cn", "sdu.edu.cn"], "region": "华东"},
    {"id": 26, "name": "中国海洋大学", "short_name": "OUC", "province": "山东", "city": "青岛",
     "email_domains": ["ouc.edu.cn"], "region": "华东"},
    {"id": 27, "name": "武汉大学", "short_name": "WHU", "province": "湖北", "city": "武汉",
     "email_domains": ["whu.edu.cn"], "region": "华中"},
    {"id": 28, "name": "华中科技大学", "short_name": "HUST", "province": "湖北", "city": "武汉",
     "email_domains": ["hust.edu.cn", "mail.hust.edu.cn"], "region": "华中"},
    {"id": 29, "name": "湖南大学", "short_name": "HNU", "province": "湖南", "city": "长沙",
     "email_domains": ["hnu.edu.cn"], "region": "华中"},
    {"id": 30, "name": "中南大学", "short_name": "CSU", "province": "湖南", "city": "长沙",
     "email_domains": ["csu.edu.cn", "mail.csu.edu.cn"], "region": "华中"},
    {"id": 31, "name": "中山大学", "short_name": "SYSU", "province": "广东", "city": "广州",
     "email_domains": ["mail2.sysu.edu.cn", "mail.sysu.edu.cn"], "region": "华南"},
    {"id": 32, "name": "华南理工大学", "short_name": "SCUT", "province": "广东", "city": "广州",
     "email_domains": ["mail.scut.edu.cn", "scut.edu.cn"], "region": "华南"},
    {"id": 33, "name": "四川大学", "short_name": "SCU", "province": "四川", "city": "成都",
     "email_domains": ["scu.edu.cn", "stu.scu.edu.cn"], "region": "西南"},
    {"id": 34, "name": "电子科技大学", "short_name": "UESTC", "province": "四川", "city": "成都",
     "email_domains": ["std.uestc.edu.cn", "uestc.edu.cn"], "region": "西南"},
    {"id": 35, "name": "重庆大学", "short_name": "CQU", "province": "重庆", "city": "重庆",
     "email_domains": ["cqu.edu.cn"], "region": "西南"},
    {"id": 36, "name": "西北工业大学", "short_name": "NWPU", "province": "陕西", "city": "西安",
     "email_domains": ["mail.nwpu.edu.cn", "nwpu.edu.cn"], "region": "西北"},
    {"id": 37, "name": "西北农林科技大学", "short_name": "NWAFU", "province": "陕西", "city": "杨凌",
     "email_domains": ["nwafu.edu.cn", "nwsuaf.edu.cn"], "region": "西北"},
    {"id": 38, "name": "兰州大学", "short_name": "LZU", "province": "甘肃", "city": "兰州",
     "email_domains": ["lzu.edu.cn"], "region": "西北"},
    {"id": 39, "name": "国防科技大学", "short_name": "NUDT", "province": "湖南", "city": "长沙",
     "email_domains": ["nudt.edu.cn"], "region": "华中"},
]

NEIGHBORING_PROVINCES = {
    "北京": ["天津", "河北", "山西", "内蒙古", "辽宁", "山东"],
    "上海": ["江苏", "浙江", "安徽"],
    "浙江": ["上海", "江苏", "安徽", "福建", "江西", "湖北"],
    "江苏": ["上海", "浙江", "安徽", "山东", "河南"],
    "安徽": ["江苏", "浙江", "上海", "江西", "湖北", "河南", "山东"],
    "黑龙江": ["吉林", "内蒙古"],
    "陕西": ["山西", "内蒙古", "宁夏", "甘肃", "四川", "重庆", "湖北", "河南"],
    "天津": ["北京", "河北"],
    "辽宁": ["吉林", "内蒙古", "河北", "北京"],  # 含近海邻省
    "吉林": ["辽宁", "黑龙江", "内蒙古"],
    "福建": ["浙江", "江西", "广东"],
    "山东": ["河北", "河南", "安徽", "江苏", "天津"],
    "湖北": ["河南", "安徽", "江西", "湖南", "重庆", "陕西"],
    "湖南": ["湖北", "江西", "广东", "广西", "贵州", "重庆"],
    "广东": ["福建", "江西", "湖南", "广西", "海南"],
    "四川": ["青海", "甘肃", "陕西", "重庆", "贵州", "云南", "西藏"],
    "重庆": ["四川", "贵州", "湖南", "湖北", "陕西"],
    "甘肃": ["新疆", "内蒙古", "宁夏", "陕西", "四川", "青海"],
}

QUOTA_PREFERENCE_MAP = {
    "not_okay": 0,       # 不接受异地
    "same_city": 1,      # 只接受同城
    "same_province": 1,  # 只接受同省
    "neighboring": 2,    # 接受邻省
    "anywhere": 3,       # 接受任何地方
}


def get_university_by_id(uid: int):
    for u in UNIVERSITIES:
        if u["id"] == uid:
            return u
    return None


def get_university_by_email(email: str) -> dict | None:
    email = email.lower().strip()
    for u in UNIVERSITIES:
        for domain in u["email_domains"]:
            if email.endswith("@" + domain):
                return u
    return None


def is_same_city(uni_id1: int, uni_id2: int) -> bool:
    u1 = get_university_by_id(uni_id1)
    u2 = get_university_by_id(uni_id2)
    if not u1 or not u2:
        return False
    return u1["city"] == u2["city"]


def is_same_province(uni_id1: int, uni_id2: int) -> bool:
    u1 = get_university_by_id(uni_id1)
    u2 = get_university_by_id(uni_id2)
    if not u1 or not u2:
        return False
    return u1["province"] == u2["province"]


def is_neighboring_province(uni_id1: int, uni_id2: int) -> bool:
    u1 = get_university_by_id(uni_id1)
    u2 = get_university_by_id(uni_id2)
    if not u1 or not u2:
        return False
    p1, p2 = u1["province"], u2["province"]
    if p1 == p2:
        return True
    return p2 in NEIGHBORING_PROVINCES.get(p1, [])
