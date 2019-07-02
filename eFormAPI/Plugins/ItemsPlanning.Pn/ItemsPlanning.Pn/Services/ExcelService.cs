/*
The MIT License (MIT)

Copyright (c) 2007 - 2019 Microting A/S

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

using System;
using System.IO;
using System.Reflection;
using System.Security.Claims;
using ItemsPlanning.Pn.Abstractions;
using ItemsPlanning.Pn.Infrastructure.Models.Report;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microting.eFormApi.BasePn.Infrastructure.Helpers;
using OfficeOpenXml;

namespace ItemsPlanning.Pn.Services
{
    public class ExcelService : IExcelService
    {
        private readonly IHttpContextAccessor _httpAccessor;
        private readonly IItemsPlanningLocalizationService _itemsPlanningLocalizationService;
        private readonly ILogger<ExcelService> _logger;

        public ExcelService(IHttpContextAccessor httpAccessor, IItemsPlanningLocalizationService itemsPlanningLocalizationService, ILogger<ExcelService> logger)
        {
            _httpAccessor = httpAccessor;
            _itemsPlanningLocalizationService = itemsPlanningLocalizationService;
            _logger = logger;
        }

        #region Write to excel

        public bool WriteRecordsExportModelsToExcelFile(ReportModel reportModel, GenerateReportModel generateReportModel, string destFile)
        {
            var file = new FileInfo(destFile);
            using (var package = new ExcelPackage(file))
            {
                var worksheet = package.Workbook.Worksheets[1];
                // Fill base info
                var nameTitle = _itemsPlanningLocalizationService.GetString("Name");
                worksheet.Cells[2, 2].Value = nameTitle;
                worksheet.Cells[2, 3].Value = reportModel.Name;

                var descriptionTitle = _itemsPlanningLocalizationService.GetString("Description");
                worksheet.Cells[3, 2].Value = descriptionTitle;
                worksheet.Cells[3, 3].Value = reportModel.Description;   

                var periodFromTitle = _itemsPlanningLocalizationService.GetString("DateFrom");
                worksheet.Cells[5, 2].Value = periodFromTitle;
                worksheet.Cells[5, 3].Value = reportModel.DateFrom?.ToString("MM/dd/yyyy HH:mm");

                var periodToTitle = _itemsPlanningLocalizationService.GetString("DateTo");
                worksheet.Cells[6, 2].Value = periodToTitle;
                worksheet.Cells[6, 3].Value = reportModel.DateTo?.ToString("MM/dd/yyyy HH:mm");

                // Fill form fields and options labels
                var row = 9;
                foreach (var field in reportModel.FormFields)
                {
                    worksheet.Cells[row, 2].Value = field.Label;

                    foreach (var option in field.Options)
                    {
                        worksheet.Cells[row++, 3].Value = option.Label;
                    }
                }

                // Fill columns for each reply
                var col = 4;
                foreach (var caseCol in reportModel.CaseColumns)
                {
                    worksheet.Cells[8, col].Value = caseCol.Date?.ToString("MM/dd/yyyy HH:mm");
                    worksheet.Cells[8, col].Style.Font.Bold = true;
                    worksheet.Cells[8, col].AutoFitColumns();
                    row = 9;
                    
                    foreach (var field in caseCol.Fields)
                    foreach (var value in field.Values)
                    {
                        if (value?.GetType() == typeof(decimal))
                        {
                            worksheet.Cells[row, col].Style.Numberformat.Format = "0.00";
                        }

                        worksheet.Cells[row++, col].Value = value;
                    }

                    col++;
                }

                package.Save(); //Save the workbook.
            }
            return true;
        }

        #endregion

        #region Working with file system
        
        private int UserId
        {
            get
            {
                string value = _httpAccessor?.HttpContext.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                return value == null ? 0 : int.Parse(value);
            }
        }

        private static string GetExcelStoragePath()
        {
            string path = Path.Combine(PathHelper.GetStoragePath(), "excel-storage");
            if (!Directory.Exists(path))
                Directory.CreateDirectory(path);
            return path;
        }

        /// <summary>
        /// Will return filename for excel file
        /// </summary>
        /// <returns></returns>
        private static string BuildFileNameForExcelFile(int userId, string templateId)
        {
            return $"{templateId}-{userId}-{DateTime.UtcNow.Ticks}.xlsx";
        }

        /// <summary>
        /// Get path and filename for particular user
        /// </summary>
        /// <returns></returns>
        private static string GetFilePathForUser(int userId, string templateId)
        {
            string filesDir = GetExcelStoragePath();
            string destFile = Path.Combine(filesDir, BuildFileNameForExcelFile(userId, templateId));
            return destFile;
        }

        /// <summary>
        /// Copy template file to new excel file
        /// </summary>
        /// <param name="templateId">The template identifier.</param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException">userId</exception>
        public string CopyTemplateForNewAccount(string templateId)
        {
            string destFile = null;
            try
            {
                int userId = UserId;
                if (userId <= 0)
                {
                    throw new ArgumentNullException(nameof(userId));
                }

                Assembly assembly = typeof(EformItemsPlanningPlugin).GetTypeInfo().Assembly;
                Stream resourceStream = assembly.GetManifestResourceStream(
                    $"ItemsPlanning.Pn.Resources.Templates.{templateId}.xlsx");

                destFile = GetFilePathForUser(userId, templateId);

                if (File.Exists(destFile))
                {
                    File.Delete(destFile);
                }
                using (FileStream fileStream = File.Create(destFile))
                {
                    resourceStream.Seek(0, SeekOrigin.Begin);
                    resourceStream.CopyTo(fileStream);
                }
                return destFile;
            }
            catch (Exception e)
            {
                _logger.LogError(e,e.Message);
                if (File.Exists(destFile))
                {
                    File.Delete(destFile);
                }
                return null;
            }
        }

        #endregion
    }
}